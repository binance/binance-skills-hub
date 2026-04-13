#!/usr/bin/env python3
"""
Payment Assistant Skill
QR Code Payment - Funding Wallet Auto-deduction (C2C + PIX)

Configuration: config.json or Environment Variables

Supported QR types:
  - C2C: Binance C2C QR code URLs
  - PIX: Brazilian PIX EMV QR codes (BR Code / Copia e Cola)

Flow:
  Phase 1: Pay Guide - QR code detection and merchant info display
  Phase 2: Pay Setup - Check eligibility and authorization
  Phase 3: QR Parsing - Parse QR and create order
  Phase 4: Submit - Submit order with amount (new step)
  Phase 5: Protection - Check payment limits
  Phase 6: Pay Confirm - Confirm and execute payment
  Phase 7: Status Poll - Poll until final status

Extension Architecture:
  Payment-type specific logic lives in extension/*.py
  Each extension handles: QR detection, parseQr, confirm params, poll params
  This file handles: config, state, API transport, action dispatch
"""
import argparse
import time
import urllib.parse
import hmac
import hashlib
import os
import json
import subprocess
import platform
import sys
import secrets
from typing import Dict, Any, Optional
from enum import Enum

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    HAS_PYZBAR = True
except ImportError:
    HAS_PYZBAR = False

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

# Try to import dev_config for testing/development features
try:
    import dev_config
    HAS_DEV_CONFIG = True
except ImportError:
    dev_config = None
    HAS_DEV_CONFIG = False

# Import payment extensions
from extension import detect_extension, get_extension_by_type, get_all_endpoints


# ============================================================
# Order Status State Machine
# ============================================================
class OrderStatus(Enum):
    """Order status for state machine tracking"""
    INIT = "INIT"                          # Initial state, QR received
    QR_PARSED = "QR_PARSED"                # parseQr success, has preset amount
    AWAITING_AMOUNT = "AWAITING_AMOUNT"    # Waiting for amount input (no preset)
    AMOUNT_SET = "AMOUNT_SET"              # Amount set, ready to confirm
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED" # confirmPayment called, polling
    POLLING = "POLLING"                    # Polling for result
    SUCCESS = "SUCCESS"                    # Payment successful
    FAILED = "FAILED"                      # Payment failed


# ============================================================
# Skills Payment Error Codes
# ============================================================
SKILLS_ERROR_CODES = {
    -7100: ('LIMIT_NOT_CONFIGURED', 'Please go to the Binance app payment setting page to set up your Agent Pay limits via MFA.'),
    -7101: ('SINGLE_LIMIT_EXCEEDED', 'Amount exceeds your limits. Please pay manually in the App.'),
    -7102: ('DAILY_LIMIT_EXCEEDED', 'Amount exceeds your limits. Please pay manually in the App.'),
    -7110: ('INSUFFICIENT_FUNDS', 'Insufficient balance in your Binance account.'),
    -7130: ('INVALID_QR_FORMAT', 'Invalid QR code format'),
    -7131: ('QR_EXPIRED_OR_NOT_FOUND', 'PayCode is invalid or expired. Please request a new one.'),
    -7199: ('INTERNAL_ERROR', 'System error, please try again later'),
}


# ============================================================
# Configuration
# ============================================================
SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE_PATH = os.path.join(SKILL_DIR, 'config.json')
STATE_FILE_PATH = os.path.join(SKILL_DIR, '.payment_state.json')
API_LOCK_FILE_PATH = os.path.join(SKILL_DIR, '.api_lock_time')
QR_CODE_OUTPUT_PATH = os.path.join(SKILL_DIR, 'payment_qr.png')
INBOX_DIR = os.path.join(SKILL_DIR, 'inbox')
CLIPBOARD_IMAGE_PATH = os.path.join(INBOX_DIR, 'qr_clipboard.png')

# API Endpoints - aggregated from all extensions
ENDPOINTS = get_all_endpoints()

# Timing configurations
POLL_INTERVAL = 2
MAX_POLL_ATTEMPTS = 30
RECV_WINDOW = 30000
API_CALL_INTERVAL = 2.0

# OpenAPI Header names (for /binancepay/openapi/* endpoints)
OPENAPI_HEADER_TIMESTAMP = 'BinancePay-Timestamp'
OPENAPI_HEADER_NONCE = 'BinancePay-Nonce'
OPENAPI_HEADER_CERT = 'BinancePay-Certificate-SN'
OPENAPI_HEADER_SIGNATURE = 'BinancePay-Signature'

# OpenAPI path prefix for routing
OPENAPI_PATH_PREFIX = '/binancepay/openapi/'

# API Key Setup Guide Message
API_KEY_GUIDE_MESSAGE = 'Payment API key & secret not configured. Please set your API key & secret in Binance App first.'

# Default config for auto-creation when config.json is missing
DEFAULT_CONFIG_TEMPLATE = {
    "_comment_1": "=== Payment Assistant Configuration ===",
    "_comment_2": "Please fill in the required fields below and set 'configured' to true",
    "_comment_3": "---",
    "configured": False,
    "_comment_api_key": "API Key: Please set your API key & secret in Binance App first",
    "api_key": "",
    "_comment_api_secret": "API Secret: Generated together with API Key, keep it safe!",
    "api_secret": "",
    "_comment_5": "--- After filling in, set 'configured' to true to enable payment ---"
}

# 如果有 dev_config，让它扩展配置模板
if HAS_DEV_CONFIG and hasattr(dev_config, 'extend_config_template'):
    DEFAULT_CONFIG_TEMPLATE = dev_config.extend_config_template(DEFAULT_CONFIG_TEMPLATE)

# Template for configuration (shown in guide)
CONFIG_TEMPLATE = {
    "configured": True,
    "api_key": "YOUR_API_KEY",
    "api_secret": "YOUR_API_SECRET"
}

# ===========================================
# Development Defaults (for testing only)
# ===========================================
_DEV_DEFAULTS = {
    # 'base_url': 'http://10.100.102.191:9056',  # DEV/TEST environment
    # 'api_key': '...',  # Never commit real keys
    # 'api_secret': '...',  # Never commit real secrets
}
# ===========================================


def create_default_config() -> str:
    """Create default config.json file with template and instructions."""
    with open(CONFIG_FILE_PATH, 'w') as f:
        json.dump(DEFAULT_CONFIG_TEMPLATE, f, indent=2, ensure_ascii=False)
    return CONFIG_FILE_PATH


def load_config() -> Dict[str, Any]:
    """
    Load configuration with priority: ENV > config.json > defaults

    If config.json doesn't exist, create a template and show setup guide.
    """
    config = {
        'api_key': '',
        'api_secret': '',
        'base_url': '',
        'configured': False
    }

    # Apply dev defaults if any (for development only)
    config.update(_DEV_DEFAULTS)

    # Check if config.json exists, if not create template
    config_created = False
    if not os.path.exists(CONFIG_FILE_PATH):
        create_default_config()
        config_created = True

    # Load from config.json
    if os.path.exists(CONFIG_FILE_PATH):
        try:
            with open(CONFIG_FILE_PATH, 'r') as f:
                file_config = json.load(f)
                file_config = {k: v for k, v in file_config.items() if not k.startswith('_')}
                config.update(file_config)
        except Exception as e:
            print(f"⚠️  Warning: Failed to load config.json: {e}")

    if config_created:
        print()
        print("════════════════════════════════════════════════════")
        print("📝 Config template created: config.json")
        print("════════════════════════════════════════════════════")
        print()
        print("⚠️  Please complete the configuration before proceeding:")
        print()
        print(f"   📁 Edit: {CONFIG_FILE_PATH}")
        print()
        print("   📋 Required steps:")
        print("      1. Fill in: api_key, api_secret")
        print('      2. Set "configured": true')
        print()
        print(f"   🔑 {API_KEY_GUIDE_MESSAGE}")
        print()
        print("════════════════════════════════════════════════════")
        print("📝 Example configuration:")
        print("════════════════════════════════════════════════════")
        print()
        print('   {')
        print('     "configured": true,')
        print('     "api_key": "your_api_key_here",')
        print('     "api_secret": "your_api_secret_here"')
        print('   }')
        print()
        print("════════════════════════════════════════════════════")
        print()

    # Override with environment variables (highest priority)
    if os.environ.get('PAYMENT_API_KEY'):
        config['api_key'] = os.environ['PAYMENT_API_KEY']
    if os.environ.get('PAYMENT_API_SECRET'):
        config['api_secret'] = os.environ['PAYMENT_API_SECRET']
    if os.environ.get('PAYMENT_BASE_URL'):
        config['base_url'] = os.environ['PAYMENT_BASE_URL']

    # Get base_url from dev_config if available and not already set via env
    if not config.get('base_url') and HAS_DEV_CONFIG and hasattr(dev_config, 'get_base_url'):
        config['base_url'] = dev_config.get_base_url()
    
    # Fallback to production URL if nothing else set
    if not config.get('base_url'):
        config['base_url'] = 'https://bpay.binanceapi.com'

    return config



def is_config_ready(config: Dict[str, Any]) -> tuple:
    """Check if configuration is ready for use."""
    if not config.get('configured', False):
        return False, 'not_configured', []

    required_fields = ['api_key', 'api_secret']
    missing = []
    for field in required_fields:
        value = config.get(field, '')
        if not value or value.startswith('YOUR_'):
            missing.append(field)
    if missing:
        return False, 'missing_fields', missing

    return True, 'ready', []


def show_config_guide(config: Dict[str, Any], reason: str, missing_fields: list = None):
    """Show configuration guide when config is not ready."""
    print()
    print("════════════════════════════════════════════════════")
    print("⚠️  Configuration Required")
    print("════════════════════════════════════════════════════")
    print()
    print("📋 Please complete the configuration before proceeding:")
    print()
    print(f"   Edit: {CONFIG_FILE_PATH}")
    print()

    if reason == 'not_configured':
        print("   1. Fill in: api_key, api_secret")
        print('   2. Set "configured": true')
    elif reason == 'missing_fields':
        print("   Missing required fields:")
        for field in (missing_fields or []):
            print(f"      ❌ {field}")
    else:
        if HAS_DEV_CONFIG and hasattr(dev_config, 'show_config_error'):
            dev_config.show_config_error(reason, config)
        else:
            print(f"   Configuration error: {reason}")

    print()
    print(f"🔑 {API_KEY_GUIDE_MESSAGE}")
    print()
    print("════════════════════════════════════════════════════")
    print("📝 Config Example:")
    print("════════════════════════════════════════════════════")
    print()
    print('   {')
    print('     "configured": true,')
    print('     "api_key": "...",')
    print('     "api_secret": "..."')
    print('   }')
    print()
    print("════════════════════════════════════════════════════")

    print(json.dumps({
        'status': 'CONFIG_REQUIRED',
        'reason': reason,
        'missing_fields': missing_fields or [],
        'config_path': CONFIG_FILE_PATH,
        'message': API_KEY_GUIDE_MESSAGE
    }))


def validate_config(config: Dict[str, Any]) -> tuple:
    """Validate configuration."""
    required_fields = ['api_key', 'api_secret']
    missing = []

    for field in required_fields:
        value = config.get(field, '')
        if not value or value.startswith('YOUR_'):
            missing.append(field)

    return len(missing) == 0, missing


# ============================================================
# API Lock Management
# ============================================================
def get_last_api_call_time() -> float:
    """Get timestamp of last API call"""
    try:
        if os.path.exists(API_LOCK_FILE_PATH):
            with open(API_LOCK_FILE_PATH, 'r') as f:
                return float(f.read().strip())
    except:
        pass
    return 0


def set_last_api_call_time(t: float):
    """Save timestamp of API call"""
    try:
        with open(API_LOCK_FILE_PATH, 'w') as f:
            f.write(str(t))
    except:
        pass


def wait_before_api_call():
    """Wait if needed to respect API rate limits"""
    last_time = get_last_api_call_time()
    if last_time > 0:
        elapsed = time.time() - last_time
        if elapsed < API_CALL_INTERVAL:
            time.sleep(API_CALL_INTERVAL - elapsed)


def mark_api_call_end():
    """Mark the end of an API call"""
    set_last_api_call_time(time.time())


# ============================================================
# State Management
# ============================================================
def save_state(state: Dict[str, Any]):
    """Save state to file"""
    state['last_updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(STATE_FILE_PATH, 'w') as f:
        json.dump(state, f, indent=2)


def load_state() -> Dict[str, Any]:
    """Load state from file"""
    if os.path.exists(STATE_FILE_PATH):
        try:
            with open(STATE_FILE_PATH, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}


def update_state(updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update state with new values"""
    state = load_state()
    state.update(updates)
    save_state(state)
    return state


def set_order_status(status: OrderStatus, **extra_fields) -> Dict[str, Any]:
    """Set order status and optionally update other fields"""
    updates = {'order_status': status.value}
    updates.update(extra_fields)
    return update_state(updates)


def get_order_status() -> Optional[OrderStatus]:
    """Get current order status"""
    state = load_state()
    status_str = state.get('order_status')
    if status_str:
        try:
            return OrderStatus(status_str)
        except ValueError:
            pass
    return None


def clear_state():
    """Clear all state for a fresh start"""
    if os.path.exists(STATE_FILE_PATH):
        os.remove(STATE_FILE_PATH)


def get_status_hint(status: OrderStatus, state: Dict[str, Any]) -> str:
    """Get hint for next action based on current status"""
    currency = state.get('currency', 'USDT')
    hints = {
        OrderStatus.INIT: "Run: --action resume (will parse QR)",
        OrderStatus.QR_PARSED: "Run: --action pay_confirm (or --action resume)",
        OrderStatus.AWAITING_AMOUNT: f"Run: --action set_amount --amount <AMOUNT> [--currency {currency}]",
        OrderStatus.AMOUNT_SET: "Run: --action pay_confirm (or --action resume)",
        OrderStatus.PAYMENT_CONFIRMED: "Run: --action poll (or --action resume)",
        OrderStatus.POLLING: "Run: --action poll (or --action resume)",
        OrderStatus.SUCCESS: "Payment complete! Run: --action reset for new payment",
        OrderStatus.FAILED: f"Failed: {state.get('error_message', 'Unknown')}. Run: --action reset",
    }
    return hints.get(status, "Run: --action status")


# ============================================================
# Shared Data Models
# ============================================================
class PaymentStatusResponse:
    """Response from queryPaymentStatus API (shared by all payment types)"""
    def __init__(self, data: Dict[str, Any]):
        self.status = data.get('status', '')
        self.asset_cost_vos = []
        if 'assetCostVos' in data and data['assetCostVos']:
            for vo in data['assetCostVos']:
                self.asset_cost_vos.append({
                    'asset': vo.get('asset', ''),
                    'amount': vo.get('amount', '0'),
                    'price': vo.get('price', '0')
                })


class ConfirmPaymentResponse:
    """Response from confirmPayment API (shared by all payment types)"""
    def __init__(self, data: Dict[str, Any]):
        self.pay_order_id = data.get('payOrderId', '')
        self.status = data.get('status', '')
        self.usd_amount = data.get('usdAmount')
        self.daily_used_before = data.get('dailyUsedBefore')
        self.daily_used_after = data.get('dailyUsedAfter')


# ============================================================
# API Client
# ============================================================
class PaymentAPI:
    """Payment API client with HMAC signing.

    Uses OpenAPI style: /binancepay/openapi/* endpoints with header-based signature.

    Extensions provide endpoints and params; this class handles transport.
    """

    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            config = load_config()
        self.config = config
        self.api_key = config.get('api_key', '')
        self.api_secret = config.get('api_secret', '')
        self.base_url = config.get('base_url', '')

    def _make_request(self, endpoint: str, params: Dict[str, Any], method: str = 'POST', use_body: bool = False) -> Dict[str, Any]:
        """Make API request using OpenAPI signing method.

        Args:
            endpoint: API path (e.g. '/binancepay/openapi/user/c2c/parseQr')
            params: Request parameters
            method: HTTP method (GET or POST)
            use_body: If True, send params as JSON body (for @RequestBody APIs)
        """
        if not HAS_REQUESTS:
            return {'success': False, 'code': '-1', 'message': 'requests module not installed'}

        if not self.base_url:
            return {'success': False, 'code': '-1', 'message': 'Missing configuration. Run --action config for setup guide.'}

        return self._make_openapi_request(endpoint, params)

    def _make_openapi_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make OpenAPI-style request with header-based signature.

        Signature format: HMAC-SHA512(payload, api_secret)
        Payload: timestamp\\n + nonce\\n + body\\n
        Headers: BinancePay-Timestamp, BinancePay-Nonce, BinancePay-Certificate-SN, BinancePay-Signature
        """
        wait_before_api_call()

        try:
            url = f"{self.base_url}{endpoint}"
            timestamp = int(time.time() * 1000)
            nonce = secrets.token_hex(16)  # 32-char random string

            # Ensure body_json matches what requests.post(json=...) will send
            # requests sends "{}" for empty dict, and the actual JSON for non-empty
            body_json = json.dumps(params) if params is not None else ''

            # Build signature (OpenAPI style: HMAC-SHA512 of timestamp + nonce + body)
            payload = f"{timestamp}\n{nonce}\n{body_json}\n"
            signature = hmac.new(self.api_secret.encode(), payload.encode(), hashlib.sha512).hexdigest().upper()

            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                OPENAPI_HEADER_TIMESTAMP: str(timestamp),
                OPENAPI_HEADER_NONCE: nonce,
                OPENAPI_HEADER_CERT: self.api_key,
                OPENAPI_HEADER_SIGNATURE: signature,
            }

            # Add gray environment header if configured
            gray_env = self.config.get('gray_env', '')
            if gray_env:
                headers['x-gray-env'] = gray_env

            if HAS_DEV_CONFIG and hasattr(dev_config, 'get_extra_headers'):
                headers.update(dev_config.get_extra_headers())

            response = requests.post(url, headers=headers, json=params, timeout=30)
            mark_api_call_end()
            return self._parse_response(response)

        except Exception as e:
            mark_api_call_end()
            return {'success': False, 'code': '-1', 'message': str(e)}

    def _parse_response(self, response) -> Dict[str, Any]:
        """Parse API response into unified format.

        OpenAPI format: {"status": "SUCCESS", "code": "000000", "data": {...}, "errorMessage": null}

        Returns:
            {'success': True, 'data': ...} on success
            {'success': False, 'code': ..., 'message': ...} on error
        """
        try:
            result = response.json()
        except:
            return {'code': str(response.status_code), 'message': response.text, 'success': False}

        code = result.get('code', '')

        # Check success condition (OpenAPI style)
        status = result.get('status', '')
        is_success = (status == 'SUCCESS' and code == '000000')

        if is_success:
            return {'success': True, 'data': result.get('data')}
        else:
            error_code = None
            try:
                error_code = int(code)
            except:
                pass
            error_message = result.get('errorMessage') or 'Unknown error'
            return {
                'success': False,
                'code': error_code or code,
                'message': error_message
            }

    def _parse_error(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Parse API error and return user-friendly info"""
        code = result.get('code')
        message = result.get('message', 'Unknown error')

        if code in SKILLS_ERROR_CODES:
            status, hint = SKILLS_ERROR_CODES[code]
            return {'status': status, 'code': code, 'message': message, 'hint': hint}

        return {'status': 'ERROR', 'code': code, 'message': message, 'hint': 'Please try again later'}

    def make_parsed_request(self, endpoint: str, params: Dict[str, Any], response_cls, method: str = 'POST', use_body: bool = False) -> Dict[str, Any]:
        """Make API request and parse response with given class.

        Used by extensions to call APIs with their own response models.

        Args:
            endpoint: API path
            params: Request parameters
            response_cls: Class to wrap the response data (e.g. C2cParseQrResponse)
            method: HTTP method
            use_body: Send params as JSON body

        Returns:
            {'success': True, 'order_info': <response_cls instance>} on success
            {'success': False, 'status': ..., 'message': ..., ...} on error
        """
        result = self._make_request(endpoint, params, method=method, use_body=use_body)
        if result['success'] and result.get('data'):
            return {'success': True, 'order_info': response_cls(result['data'])}
        error_info = self._parse_error(result)
        return {'success': False, **error_info}

    def confirm_payment(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call confirmPayment endpoint (shared response format)."""
        result = self._make_request(endpoint, params, use_body=True)
        if result['success'] and result.get('data'):
            return {'success': True, 'payment_info': ConfirmPaymentResponse(result['data'])}
        error_info = self._parse_error(result)
        return {'success': False, **error_info}

    def query_payment_status(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call queryPaymentStatus endpoint (shared response format)."""
        result = self._make_request(endpoint, params, method='POST', use_body=True)
        if result['success'] and result.get('data'):
            return {'success': True, 'status_info': PaymentStatusResponse(result['data'])}
        error_info = self._parse_error(result)
        return {'success': False, **error_info}


# ============================================================
# State helpers dict - passed to extension.purchase()
# ============================================================
def _get_state_helpers() -> Dict[str, Any]:
    """Build the state_helpers dict that extensions use to manage state."""
    return {
        'set_order_status': set_order_status,
        'update_state': update_state,
        'OrderStatus': OrderStatus,
    }


# ============================================================
# QR Code Handler
# ============================================================
class QRCodeHandler:
    """Handle QR code generation, decoding, and clipboard/inbox image operations."""

    @staticmethod
    def generate_qr_image(qr_string: str, output_path: str = QR_CODE_OUTPUT_PATH) -> Optional[str]:
        """Generate QR code image from string"""
        if not HAS_QRCODE:
            return None
        try:
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=5, border=2)
            qr.add_data(qr_string)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            img.save(output_path)
            return output_path
        except:
            return None

    @staticmethod
    def decode_qr_from_image(image_path: str) -> Optional[str]:
        """Decode QR code from image file. Tries pyzbar first, then opencv."""
        # Try pyzbar first
        if HAS_PIL and HAS_PYZBAR:
            try:
                img = Image.open(image_path)
                decoded = pyzbar_decode(img)
                if decoded:
                    return decoded[0].data.decode('utf-8')
            except Exception:
                pass

        # Fallback to OpenCV
        if HAS_CV2:
            try:
                img = cv2.imread(image_path)
                if img is not None:
                    detector = cv2.QRCodeDetector()
                    data, _, _ = detector.detectAndDecode(img)
                    if data:
                        return data
            except Exception:
                pass

        return None

    @staticmethod
    def save_clipboard_image_macos(output_path: str) -> bool:
        """Save clipboard image to file on macOS using osascript"""
        try:
            script = f'''
            set theFile to POSIX file "{output_path}"
            try
                set imgData to the clipboard as «class PNGf»
                set fileRef to open for access theFile with write permission
                write imgData to fileRef
                close access fileRef
                return "success"
            on error
                return "no_image"
            end try
            '''
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=5)
            return 'success' in result.stdout
        except:
            return False

    @staticmethod
    def save_clipboard_image_linux(output_path: str) -> bool:
        """Save clipboard image to file on Linux using xclip"""
        try:
            result = subprocess.run(
                ['xclip', '-selection', 'clipboard', '-t', 'image/png', '-o'],
                capture_output=True, timeout=5
            )
            if result.returncode == 0 and result.stdout:
                with open(output_path, 'wb') as f:
                    f.write(result.stdout)
                return True
        except:
            pass
        return False

    @staticmethod
    def save_clipboard_image_windows(output_path: str) -> bool:
        """Save clipboard image to file on Windows"""
        try:
            script = f'''
            Add-Type -AssemblyName System.Windows.Forms
            $img = [System.Windows.Forms.Clipboard]::GetImage()
            if ($img) {{
                $img.Save("{output_path}")
                Write-Output "success"
            }} else {{
                Write-Output "no_image"
            }}
            '''
            result = subprocess.run(['powershell', '-Command', script], capture_output=True, text=True, timeout=5)
            return 'success' in result.stdout
        except:
            return False

    @staticmethod
    def save_clipboard_image(output_path: str) -> bool:
        """Save clipboard image to file (cross-platform)"""
        system = platform.system().lower()
        if system == 'darwin':
            return QRCodeHandler.save_clipboard_image_macos(output_path)
        elif system == 'linux':
            return QRCodeHandler.save_clipboard_image_linux(output_path)
        elif system == 'windows':
            return QRCodeHandler.save_clipboard_image_windows(output_path)
        return False

    @staticmethod
    def decode_qr_from_clipboard() -> tuple:
        """
        Decode QR from clipboard image.
        Returns: (success: bool, qr_data: str or None, message: str)
        """
        os.makedirs(INBOX_DIR, exist_ok=True)

        if not QRCodeHandler.save_clipboard_image(CLIPBOARD_IMAGE_PATH):
            return False, None, "clipboard_no_image"

        qr_data = QRCodeHandler.decode_qr_from_image(CLIPBOARD_IMAGE_PATH)
        if qr_data:
            return True, qr_data, "success"
        else:
            return False, None, "decode_failed"

    @staticmethod
    def parse_emvco_qr(qr_string: str) -> Dict[str, str]:
        """Parse EMVCo QR code format to extract merchant info"""
        result = {}
        try:
            if '5918' in qr_string:
                idx = qr_string.index('5918') + 4
                result['merchant_name'] = qr_string[idx:idx+18].strip()
            if '6012' in qr_string:
                idx = qr_string.index('6012') + 4
                result['merchant_city'] = qr_string[idx:idx+12].strip()
            if '5802' in qr_string:
                idx = qr_string.index('5802') + 4
                result['country_code'] = qr_string[idx:idx+2]
        except:
            pass
        return result


# ============================================================
# Actions
# ============================================================
def action_config():
    """Show configuration status and guide user to complete setup"""
    config = load_config()
    is_valid, missing = validate_config(config)
    file_exists = os.path.exists(CONFIG_FILE_PATH)

    print()
    print("════════════════════════════════════════════════════")
    print("⚙️  Configuration Status")
    print("════════════════════════════════════════════════════")
    print()
    print(f"📁 Config file: {CONFIG_FILE_PATH}")
    print(f"   Status: {'✅ Exists' if file_exists else '❌ Not found'}")
    print()

    base_url_ok = config.get('base_url') and len(config.get('base_url', '')) > 0
    api_key_ok = config.get('api_key') and len(config.get('api_key', '')) > 0
    api_secret_ok = config.get('api_secret') and len(config.get('api_secret', '')) > 0

    print("📊 Current Settings:")
    print(f"   base_url:   {'✅ ' + config.get('base_url', '') + ' (auto)' if base_url_ok else '❌ Not set'}")
    print(f"   api_key:    {'✅ ****' + config.get('api_key', '')[-4:] if api_key_ok else '❌ Not set'}")
    print(f"   api_secret: {'✅ ****' + config.get('api_secret', '')[-4:] if api_secret_ok else '❌ Not set'}")
    print()

    if HAS_DEV_CONFIG and hasattr(dev_config, 'extend_config_display'):
        extra_lines = dev_config.extend_config_display(config)
        for line in extra_lines:
            print(line)

    if is_valid:
        print("════════════════════════════════════════════════════")
        print("✅ Ready")
        print("════════════════════════════════════════════════════")
        print("   All credentials are configured.")
    else:
        print("════════════════════════════════════════════════════")
        print("⚠️  Setup Required")
        print("════════════════════════════════════════════════════")
        print(f"   Missing: {', '.join(missing)}")
        print()
        print(f"📝 Please edit: {CONFIG_FILE_PATH}")
        print()
        print("   Required fields:")
        if 'api_key' in missing:
            print("   • api_key:    Your API key")
        if 'api_secret' in missing:
            print("   • api_secret: Your API secret")
        print()
        print("📝 Configuration Template:")
        print('   {')
        print('     "configured": true,')
        print('     "api_key": "YOUR_API_KEY",')
        print('     "api_secret": "YOUR_API_SECRET"')
        print('   }')
        print()
        print(f"🔑 {API_KEY_GUIDE_MESSAGE}")
        print()
        print("   Or use environment variables:")
        print("   export PAYMENT_API_KEY='your_key'")
        print("   export PAYMENT_API_SECRET='your_secret'")

    print("════════════════════════════════════════════════════")
    print()

    print(json.dumps({
        'config_exists': file_exists,
        'is_valid': is_valid,
        'missing_fields': missing,
        'config_path': CONFIG_FILE_PATH
    }))


def action_purchase(config: Dict[str, Any], raw_qr: str):
    """
    Unified Purchase Flow - Step 1: Parse QR

    Auto-detects QR type and delegates to the matching extension.
    """
    if not raw_qr:
        print()
        print("❌ Missing QR code")
        print("💡 Please provide QR code data with --raw_qr parameter")
        print()
        return

    is_ready, reason, missing_fields = is_config_ready(config)
    if not is_ready:
        show_config_guide(config, reason, missing_fields)
        return

    # Detect QR type via extension registry
    ext = detect_extension(raw_qr)
    api = PaymentAPI(config)

    print()
    print("════════════════════════════════════════════════════")
    print(f"📦 Starting {ext.payment_type} Purchase Flow")
    print("════════════════════════════════════════════════════")
    if HAS_DEV_CONFIG and hasattr(dev_config, 'get_mode_display'):
        mode_line = dev_config.get_mode_display(config)
        if mode_line:
            print(mode_line)
    print()

    # Initialize state with payment type
    update_state({
        'raw_qr': raw_qr,
        'payment_type': ext.payment_type,
        'order_status': OrderStatus.INIT.value
    })

    # Delegate to extension
    ext.purchase(api, raw_qr, _get_state_helpers())


def action_set_amount(amount: float, currency: str = None):
    """Set payment amount (and optionally currency) for orders without preset amount"""
    state = load_state()

    if not state.get('checkout_id'):
        print()
        print("❌ No active order")
        print("💡 Run '--action purchase --raw_qr <QR_DATA>' first")
        print()
        return

    # Block amount change if PIX QR has a locked amount
    if state.get('pix_amount_locked'):
        preset = state.get('preset_amount') or state.get('suggested_amount')
        cur = state.get('currency', 'BRL')
        print()
        print("════════════════════════════════════════════════════")
        print("❌ Cannot change amount")
        print("════════════════════════════════════════════════════")
        print(f"   This PIX QR code has a fixed amount: {preset} {cur}")
        print("   The amount is embedded in the QR code and cannot be modified.")
        print()
        print("💡 Reply 'y' to confirm payment with the QR amount, 'n' to cancel")
        print()
        print(json.dumps({
            'status': 'AMOUNT_LOCKED',
            'message': f'PIX QR has fixed amount: {preset} {cur}. Cannot be modified.',
            'locked_amount': str(preset),
            'currency': cur
        }))
        return

    final_currency = currency or state.get('currency', 'USDT')

    set_order_status(OrderStatus.AMOUNT_SET,
        suggested_amount=amount,
        currency=final_currency,
        needs_amount_input=False
    )

    print()
    print(f"✅ Amount set: {amount} {final_currency}")
    print()
    print("💡 Reply 'y' to confirm, 'n' to cancel")
    print(json.dumps({
        'status': 'AMOUNT_SET',
        'amount': amount,
        'currency': final_currency,
        'checkout_id': state.get('checkout_id'),
        'payee': state.get('nickname')
    }))


def action_pay_confirm(config: Dict[str, Any], amount: float = None, currency: str = None):
    """
    Payment Flow - Step 2: Confirm Payment

    Routes to the correct extension endpoint based on payment_type in state.
    """
    is_ready, reason, missing_fields = is_config_ready(config)
    if not is_ready:
        show_config_guide(config, reason, missing_fields)
        return

    state = load_state()

    # Safety check: Prevent duplicate payment
    current_status = state.get('order_status')
    if current_status in [OrderStatus.SUCCESS.value, OrderStatus.PAYMENT_CONFIRMED.value, OrderStatus.POLLING.value]:
        print()
        print("════════════════════════════════════════════════════")
        print("⚠️  Payment Already In Progress or Complete")
        print("════════════════════════════════════════════════════")
        print(f"   Current status: {current_status}")
        if current_status == OrderStatus.SUCCESS.value:
            print("   This order has already been paid successfully.")
        else:
            print("   Payment is in progress. Run --action poll to check result.")
        print()
        print("💡 Run: --action status to check current state")
        print("   Run: --action reset to start a new payment")
        print()
        return

    if not state.get('checkout_id'):
        print()
        print("❌ No active order")
        print("💡 Run '--action purchase --raw_qr <QR_DATA>' first")
        print()
        return

    # If PIX amount is locked, force use the QR amount regardless of user input
    if state.get('pix_amount_locked'):
        locked_amount = state.get('preset_amount') or state.get('suggested_amount')
        if locked_amount is not None:
            if amount is not None and float(amount) != float(locked_amount):
                print(f"⚠️  PIX QR has fixed amount {locked_amount} {state.get('currency', 'BRL')}. Ignoring user amount {amount}.")
            amount = float(locked_amount)
            currency = state.get('currency', 'BRL')

    if amount is None:
        amount = state.get('suggested_amount')

    if amount is None:
        print()
        print("❌ No amount specified")
        print("💡 Use: --action set_amount --amount <amount> [--currency <currency>]")
        print()
        return

    final_currency = currency or state.get('currency', 'USDT')

    # Get the right extension for this payment type
    payment_type = state.get('payment_type', 'C2C')
    ext = get_extension_by_type(payment_type)
    api = PaymentAPI(config)

    payee = state.get('nickname', 'Unknown')
    amount_str = str(int(amount)) if amount == int(amount) else str(amount)

    print()
    print("════════════════════════════════════════════════════")
    print(f"💳 [Step 2] Confirming {payment_type} Payment")
    print("════════════════════════════════════════════════════")
    print(f"   Checkout: {state.get('checkout_id')}")
    print(f"   Amount:   {amount_str} {final_currency}")
    print(f"   Payee:    {payee}")
    print()

    # Build params via extension and call API
    print("🔄 Processing payment...")
    confirm_params = ext.build_confirm_params(state, amount_str, final_currency)
    confirm_result = api.confirm_payment(ext.get_confirm_endpoint(), confirm_params)

    if not confirm_result['success']:
        error_status = confirm_result.get('status', 'ERROR')
        error_msg = confirm_result.get('message', 'Payment failed')
        error_hint = confirm_result.get('hint', '')
        error_code = confirm_result.get('code')

        set_order_status(OrderStatus.FAILED, error_message=error_msg, error_code=error_code)

        print()
        print("════════════════════════════════════════════════════")
        print(f"❌ Payment Failed")
        print("════════════════════════════════════════════════════")
        print(f"   {error_msg}")
        if error_hint:
            print(f"   💡 {error_hint}")
        print("════════════════════════════════════════════════════")

        print(json.dumps({
            'status': error_status,
            'code': error_code,
            'message': error_msg,
            'hint': error_hint
        }))
        return

    payment_info = confirm_result['payment_info']

    set_order_status(OrderStatus.PAYMENT_CONFIRMED,
        pay_order_id=payment_info.pay_order_id,
        amount=amount,
        currency=final_currency,
        usd_amount=str(payment_info.usd_amount) if payment_info.usd_amount else None,
        daily_used_before=str(payment_info.daily_used_before) if payment_info.daily_used_before is not None else None,
        daily_used_after=str(payment_info.daily_used_after) if payment_info.daily_used_after is not None else None
    )

    print("✅ Payment confirmed, processing...")
    print(f"   Pay Order ID: {payment_info.pay_order_id}")
    if payment_info.usd_amount:
        print(f"   USD Amount: {payment_info.usd_amount}")
    daily_limit = state.get('daily_limit')
    if payment_info.daily_used_before is not None and payment_info.daily_used_after is not None and daily_limit:
        print(f"   Daily Usage: {payment_info.daily_used_before} → {payment_info.daily_used_after} / {daily_limit} USD")
    elif payment_info.daily_used_after is not None and daily_limit:
        print(f"   Daily Usage: {payment_info.daily_used_after} / {daily_limit} USD")

    print(json.dumps({
        'status': 'PROCESSING',
        'pay_order_id': payment_info.pay_order_id,
        'amount': amount,
        'currency': final_currency,
        'payee': payee,
        'usd_amount': str(payment_info.usd_amount) if payment_info.usd_amount else None,
        'daily_used_before': str(payment_info.daily_used_before) if payment_info.daily_used_before is not None else None,
        'daily_used_after': str(payment_info.daily_used_after) if payment_info.daily_used_after is not None else None,
        'daily_limit': daily_limit
    }))


def action_poll(config: Dict[str, Any]):
    """Payment Flow - Step 3: Poll payment status until final result"""
    state = load_state()
    pay_order_id = state.get('pay_order_id')

    if not pay_order_id:
        print()
        print("❌ No active payment")
        print()
        return

    # Get the right extension for this payment type
    payment_type = state.get('payment_type', 'C2C')
    ext = get_extension_by_type(payment_type)
    api = PaymentAPI(config)

    print()
    print("🔍 Querying order status...")

    poll_params = ext.build_poll_params(state)
    status_result = api.query_payment_status(ext.get_poll_endpoint(), poll_params)

    if not status_result['success']:
        print(f"❌ Query failed: {status_result.get('message', '')}")
        return

    status_info = status_result['status_info']
    status_icon = '✅' if status_info.status == 'SUCCESS' else ('❌' if status_info.status in ['FAILED', 'FAIL'] else '⏳')
    status_text = 'Success' if status_info.status == 'SUCCESS' else ('Failed' if status_info.status in ['FAILED', 'FAIL'] else 'Processing')

    print()
    print("════════════════════════════════════════════════════")
    print(f"{status_icon} Status: {status_text}")
    print("════════════════════════════════════════════════════")
    print(f"   📝 Pay Order: {pay_order_id}")
    if state.get('amount'):
        print(f"   💵 Amount Sent: {state['amount']} {state.get('currency', 'USDT')}")
    if status_info.asset_cost_vos:
        costs = [f"{vo['amount']} {vo['asset']}" for vo in status_info.asset_cost_vos]
        print(f"   💳 Paid With: {' + '.join(costs)}")
    # Show daily usage change on success
    daily_used_before = state.get('daily_used_before')
    daily_used_after = state.get('daily_used_after')
    daily_limit = state.get('daily_limit')
    if status_info.status == 'SUCCESS' and daily_used_before is not None and daily_used_after is not None and daily_limit:
        print(f"   📊 Daily Usage: {daily_used_before} → {daily_used_after} / {daily_limit} USD")
    print("════════════════════════════════════════════════════")
    print(json.dumps({
        'status': status_info.status,
        'pay_order_id': pay_order_id,
        'amount_sent': state.get('amount'),
        'currency': state.get('currency', 'USDT'),
        'paid_with': status_info.asset_cost_vos if status_info.asset_cost_vos else None,
        'daily_used_before': daily_used_before,
        'daily_used_after': daily_used_after,
        'daily_limit': daily_limit
    }))


def action_status():
    """Show current order status and next steps"""
    state = load_state()
    status = get_order_status()

    print()
    print("════════════════════════════════════════════════════")
    print("📊 Current Order Status")
    print("════════════════════════════════════════════════════")

    if not state or not status:
        print("   No active order")
        print()
        print("💡 Start with: --action purchase --raw_qr <QR_DATA>")
        print("════════════════════════════════════════════════════")
        return

    checkout_id = state.get('checkout_id')
    pay_order_id = state.get('pay_order_id')
    payment_type = state.get('payment_type', 'C2C')

    print(f"   Type:        {payment_type}")
    print(f"   Status:      {status.value}")
    print(f"   Checkout ID: {checkout_id or 'Not yet created'}")
    if pay_order_id:
        print(f"   Pay Order:   {pay_order_id}")

    if state.get('nickname'):
        print(f"   Payee:       {state.get('nickname')}")
    if state.get('receiver_psp'):
        print(f"   Bank:        {state.get('receiver_psp')}")
    if state.get('receiver_document'):
        print(f"   Document:    {state.get('receiver_document')}")
    if state.get('currency'):
        print(f"   Currency:    {state.get('currency')}")
    if state.get('suggested_amount') or state.get('amount'):
        amt = state.get('amount') or state.get('suggested_amount')
        print(f"   Amount:      {amt} {state.get('currency', '')}")
    if state.get('error_message'):
        print(f"   Error:       {state.get('error_message')}")
    if state.get('last_updated'):
        print(f"   Updated:     {state.get('last_updated')}")

    print()
    print(f"💡 {get_status_hint(status, state)}")
    print("════════════════════════════════════════════════════")

    print(json.dumps({
        'status': status.value,
        'payment_type': payment_type,
        'checkout_id': checkout_id,
        'pay_order_id': pay_order_id,
        'amount': state.get('amount') or state.get('suggested_amount'),
        'currency': state.get('currency'),
        'payee': state.get('nickname')
    }))


def action_reset():
    """Clear state and start fresh"""
    clear_state()
    print()
    print("🗑️  State cleared")
    print()
    print("💡 Ready for new payment: --action purchase --raw_qr <QR_DATA>")
    print()


def action_resume(config: Dict[str, Any]):
    """Resume from current state - automatically continue the payment flow."""
    is_ready, reason, missing_fields = is_config_ready(config)
    if not is_ready:
        show_config_guide(config, reason, missing_fields)
        return

    state = load_state()
    status = get_order_status()

    if not state or not status:
        print()
        print("📭 No active order to resume")
        print("💡 Start with: --action purchase --raw_qr <QR_DATA>")
        print()
        return

    print()
    print(f"🔄 Resuming from status: {status.value}")
    print()

    if status == OrderStatus.INIT:
        raw_qr = state.get('raw_qr')
        if raw_qr:
            action_purchase(config, raw_qr)
        else:
            print("❌ No QR code in state")
            print("💡 Run: --action purchase --raw_qr <QR_DATA>")

    elif status == OrderStatus.QR_PARSED:
        if state.get('has_preset_amount') and state.get('preset_amount'):
            amount = float(state.get('preset_amount'))
            action_pay_confirm(config, amount)
        else:
            print("💡 Please set amount: --action set_amount --amount <AMOUNT>")
            print(f"   Currency: {state.get('currency', 'USDT')}")

    elif status == OrderStatus.AWAITING_AMOUNT:
        print("💡 Please set amount: --action set_amount --amount <AMOUNT>")
        print(f"   Currency: {state.get('currency', 'USDT')}")

    elif status == OrderStatus.AMOUNT_SET:
        amount = state.get('suggested_amount') or state.get('amount')
        if amount:
            action_pay_confirm(config, float(amount))
        else:
            print("❌ No amount set")
            print("💡 Run: --action set_amount --amount <AMOUNT>")

    elif status in [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.POLLING]:
        action_poll(config)

    elif status == OrderStatus.SUCCESS:
        print("✅ Payment already completed!")
        if state.get('asset_costs'):
            costs = [f"{c.get('amount')} {c.get('asset')}" for c in state['asset_costs']]
            print(f"   💳 Paid With: {' + '.join(costs)}")
        print()
        print("💡 Run: --action reset for a new payment")

    elif status == OrderStatus.FAILED:
        print(f"❌ Order failed: {state.get('error_message', 'Unknown error')}")
        print()
        print("💡 Run: --action reset to start over")

    else:
        print(f"⚠️  Unknown status: {status.value}")
        print("💡 Run: --action status to check details")


def action_help():
    """Show help information"""
    print()
    print("════════════════════════════════════════════════════")
    print("👋 Payment Assistant Skill (C2C + PIX)")
    print("════════════════════════════════════════════════════")
    print()
    print("📋 Core Actions (3-step flow):")
    print("   purchase     - Step 1: Parse QR (requires --raw_qr)")
    print("                  Auto-detects C2C URL or PIX EMV QR")
    print("   set_amount   - Set amount (e.g., --amount 100 --currency BRL)")
    print("   pay_confirm  - Step 2: Confirm payment")
    print("   poll         - Step 3: Poll until final status")
    print("   query        - Check order status (API call)")
    print()
    print("📷 QR Decode Actions:")
    print("   decode_qr    - Decode QR from clipboard or image file")
    print()
    print("🔄 Recovery Actions:")
    print("   status       - Show current state and next steps")
    print("   resume       - Auto-continue from any state")
    print("   reset        - Clear state for fresh start")
    print()
    print("⚙️  Config Actions:")
    print("   config       - Show configuration guide")

    if HAS_DEV_CONFIG and hasattr(dev_config, 'get_extra_help_lines'):
        for line in dev_config.get_extra_help_lines():
            print(line)

    print()
    print("💡 C2C Example Flow:")
    print("   1. --action decode_qr                    # Decode from clipboard/inbox")
    print("   2. --action purchase --raw_qr '<QR_DATA>'")
    print("   3. --action set_amount --amount 50       # If no preset amount")
    print("   4. --action pay_confirm")
    print("   5. --action poll")
    print()
    print("💡 PIX Example Flow:")
    print("   1. --action purchase --raw_qr '00020126...br.gov.bcb.pix...'")
    print("   2. --action set_amount --amount 100 --currency BRL  # If no preset")
    print("   3. --action pay_confirm")
    print("   4. --action poll")
    print()
    print("🔄 Recovery (if interrupted at any point):")
    print("   --action status   # Check where you are")
    print("   --action resume   # Auto-continue")
    print("════════════════════════════════════════════════════")
    print()


def _get_file_info(file_path: str) -> Dict[str, Any]:
    """Get file metadata for debugging/transparency."""
    try:
        stat = os.stat(file_path)
        return {
            'path': file_path,
            'filename': os.path.basename(file_path),
            'size_bytes': stat.st_size,
            'modified_time': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime)),
        }
    except Exception:
        return {'path': file_path, 'filename': os.path.basename(file_path)}


def action_decode_qr(image_path: str = None, base64_data: str = None, use_clipboard: bool = False):
    """
    Decode QR code from image.

    Three MUTUALLY EXCLUSIVE input modes (no fallback between them):
    - --image <path>     : Decode from file path
    - --base64 <data>    : Decode from base64 encoded image
    - --clipboard        : Explicitly read from system clipboard

    If no input specified, returns an error asking for explicit input.
    This ensures 100% clarity on which image is being decoded.

    Returns JSON with qr_data and source info for transparency.
    """
    qr_handler = QRCodeHandler()

    has_decoder = (HAS_PIL and HAS_PYZBAR) or HAS_CV2
    if not has_decoder:
        print(json.dumps({
            'success': False,
            'error': 'missing_dependencies',
            'message': "No QR decoder available. Install: pip install opencv-python pyzbar"
        }))
        return

    # Count how many input modes are specified
    input_modes = sum([bool(image_path), bool(base64_data), use_clipboard])

    if input_modes > 1:
        print(json.dumps({
            'success': False,
            'error': 'multiple_inputs',
            'message': "Only one input mode allowed. Use --image OR --base64 OR --clipboard, not multiple.",
            'hint': 'Choose one input source to avoid ambiguity.'
        }))
        return

    if input_modes == 0:
        print(json.dumps({
            'success': False,
            'error': 'no_input',
            'message': "No image input specified. You must provide one of: --image, --base64, or --clipboard",
            'usage': {
                '--image <path>': 'Path to image file (from message attachment)',
                '--base64 <data>': 'Base64 encoded image data',
                '--clipboard': 'Read from system clipboard (user must have just copied an image)'
            },
            'hint': 'AI should use --image with the attachment path from the user message, or use Vision to read QR directly and pass --raw_qr to purchase action.'
        }))
        return

    # ============================================================
    # Mode 1: Image file path
    # ============================================================
    if image_path:
        if not os.path.exists(image_path):
            print(json.dumps({
                'success': False,
                'error': 'file_not_found',
                'message': f"File not found: {image_path}",
                'source_type': 'image_path',
                'provided_path': image_path
            }))
            return

        file_info = _get_file_info(image_path)
        qr_data = qr_handler.decode_qr_from_image(image_path)

        if qr_data:
            print(json.dumps({
                'success': True,
                'qr_data': qr_data,
                'source_type': 'image_path',
                'source_info': file_info,
                'message': f"QR decoded from: {file_info['filename']}"
            }))
        else:
            print(json.dumps({
                'success': False,
                'error': 'decode_failed',
                'message': f"No QR code found in image: {file_info['filename']}",
                'source_type': 'image_path',
                'source_info': file_info,
                'hint': 'Image exists but no QR code detected. Verify this is the correct image.'
            }))
        return

    # ============================================================
    # Mode 2: Base64 encoded image
    # ============================================================
    if base64_data:
        import base64
        import tempfile

        try:
            # Remove data URI prefix if present (e.g., "data:image/png;base64,")
            if ',' in base64_data:
                base64_data = base64_data.split(',', 1)[1]

            image_bytes = base64.b64decode(base64_data)

            # Save to temp file for decoding
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp.write(image_bytes)
                tmp_path = tmp.name

            qr_data = qr_handler.decode_qr_from_image(tmp_path)

            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass

            if qr_data:
                print(json.dumps({
                    'success': True,
                    'qr_data': qr_data,
                    'source_type': 'base64',
                    'source_info': {
                        'data_length': len(base64_data),
                        'decoded_size': len(image_bytes)
                    },
                    'message': 'QR decoded from base64 image data'
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'error': 'decode_failed',
                    'message': 'No QR code found in base64 image',
                    'source_type': 'base64',
                    'hint': 'Image decoded successfully but no QR code detected.'
                }))
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': 'base64_decode_failed',
                'message': f'Failed to decode base64 image: {str(e)}',
                'source_type': 'base64',
                'hint': 'Ensure the base64 data is valid image data.'
            }))
        return

    # ============================================================
    # Mode 3: System clipboard (explicit)
    # ============================================================
    if use_clipboard:
        success, data, msg = qr_handler.decode_qr_from_clipboard()

        if success:
            print(json.dumps({
                'success': True,
                'qr_data': data,
                'source_type': 'clipboard',
                'source_info': {
                    'method': 'system_clipboard',
                    'note': 'Image was read from current system clipboard'
                },
                'message': 'QR decoded from clipboard'
            }))
        else:
            print(json.dumps({
                'success': False,
                'error': 'clipboard_failed',
                'message': msg or 'Failed to read QR from clipboard',
                'source_type': 'clipboard',
                'hint': 'Ensure an image is copied to clipboard. On macOS: Cmd+Ctrl+Shift+4 to screenshot to clipboard.'
            }))
        return


# ============================================================
# Main Entry Point
# ============================================================
def main():
    parser = argparse.ArgumentParser(description='Payment Assistant Skill (C2C + PIX)')

    available_actions = ['purchase', 'set_amount', 'pay_confirm', 'poll', 'query', 'status', 'resume', 'reset', 'config', 'help', 'decode_qr']

    if HAS_DEV_CONFIG and hasattr(dev_config, 'get_extra_actions'):
        available_actions.extend(dev_config.get_extra_actions())

    parser.add_argument('--action', type=str, required=True, choices=available_actions)
    parser.add_argument('--raw_qr', type=str, help='Raw QR code data (C2C URL or PIX EMV string)')
    parser.add_argument('--amount', type=float, help='Payment amount')
    parser.add_argument('--currency', type=str, help='Payment currency (e.g., USDT, BRL, BTC)')
    parser.add_argument('--image', type=str, help='Image file path for decode_qr')
    parser.add_argument('--base64', type=str, help='Base64 encoded image data for decode_qr')
    parser.add_argument('--clipboard', action='store_true', help='Explicitly read from system clipboard')

    if HAS_DEV_CONFIG and hasattr(dev_config, 'add_extra_arguments'):
        dev_config.add_extra_arguments(parser)

    args = parser.parse_args()

    config = load_config()

    if HAS_DEV_CONFIG and hasattr(dev_config, 'process_extra_args'):
        dev_config.process_extra_args(args, config)

    if HAS_DEV_CONFIG and hasattr(dev_config, 'handle_extra_action'):
        if dev_config.handle_extra_action(args.action, args, config, update_state):
            return

    if args.action == 'help':
        action_help()
    elif args.action == 'config':
        action_config()
    elif args.action == 'status':
        action_status()
    elif args.action == 'reset':
        action_reset()
    elif args.action == 'resume':
        action_resume(config)
    elif args.action == 'decode_qr':
        action_decode_qr(image_path=args.image, base64_data=args.base64, use_clipboard=args.clipboard)
    elif args.action == 'purchase':
        action_purchase(config, args.raw_qr)
    elif args.action == 'set_amount':
        if args.amount is None:
            print("❌ --amount required")
            return
        action_set_amount(args.amount, args.currency)
    elif args.action == 'pay_confirm':
        action_pay_confirm(config, args.amount, args.currency)
    elif args.action == 'poll':
        action_poll(config)
    elif args.action == 'query':
        action_poll(config)


if __name__ == '__main__':
    main()
