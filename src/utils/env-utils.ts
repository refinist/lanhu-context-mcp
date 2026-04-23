export function envBool(name: string): boolean {
  const v = process.env[name];
  return v === 'true' || v === '1';
}
