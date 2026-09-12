/**
 * Mask sensitive string for display.
 * Format: first 5 chars + "..." + last 4 chars
 * Example: "0x9f199B93aE33C330880bdB31422Fca37c6d3fb14" → "0x9f1...fb14"
 */
export function maskString(input: string): string {
  if (!input) return "";
  if (input.length <= 9) return `${input.slice(0, 2)}...`;
  return `${input.slice(0, 5)}...${input.slice(-4)}`;
}
