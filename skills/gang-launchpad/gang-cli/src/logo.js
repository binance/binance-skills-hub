import { readFileSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const MAX_BYTES = 512 * 1024
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export const LOGO_API = process.env.GANG_LOGO_API || 'https://gang.fun/api/logos'
export const LOGO_UI = 'https://gang.fun/dev/logo'

/** Read a local image → data URL → POST /api/logos → { logoUrl, id, bytes }. */
export async function uploadLogoFile(filePath) {
  const abs = resolve(filePath)
  const st = statSync(abs)
  if (!st.isFile()) throw new Error(`not a file: ${abs}`)
  if (st.size <= 0) throw new Error(`empty file: ${abs}`)
  if (st.size > MAX_BYTES) throw new Error(`logo too large: ${st.size} bytes (max ${MAX_BYTES})`)
  const ext = extname(abs).toLowerCase()
  const mime = MIME[ext]
  if (!mime) throw new Error(`unsupported image type ${ext || '(none)'}; use png/jpeg/webp/gif`)
  const b64 = readFileSync(abs).toString('base64')
  const image = `data:${mime};base64,${b64}`
  const res = await fetch(LOGO_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ image }),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { throw new Error(`logo upload non-JSON (${res.status}): ${text.slice(0, 200)}`) }
  if (!res.ok || !json?.ok || !json?.logoUrl) {
    throw new Error(json?.error || `logo upload failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return { logoUrl: json.logoUrl, id: json.id, bytes: json.bytes ?? st.size, api: LOGO_API }
}
