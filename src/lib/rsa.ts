/** Big-integer toolkit for the CryptoStack demo: modular arithmetic, Miller-Rabin, RSA keys, CRT, integer roots. */
export const modpow = (b: bigint, e: bigint, m: bigint) => {
  let r = 1n; b %= m;
  while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; b = (b * b) % m; }
  return r;
};
export const gcd = (a: bigint, b: bigint): bigint => { while (b) [a, b] = [b, a % b]; return a; };
export function modinv(a: bigint, m: bigint) {
  let [r0, r1, s0, s1] = [((a % m) + m) % m, m, 1n, 0n];
  while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  return ((s0 % m) + m) % m;
}
const SMALL = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
export function isPrime(n: bigint) {
  if (n < 2n) return false;
  for (const p of SMALL) if (n % p === 0n) return n === p;
  let d = n - 1n, s = 0;
  while (!(d & 1n)) { d >>= 1n; s++; }
  for (const a of SMALL) {
    let x = modpow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let ok = false;
    for (let i = 1; i < s; i++) { x = (x * x) % n; if (x === n - 1n) { ok = true; break; } }
    if (!ok) return false;
  }
  return true;
}
export function randBig(bits: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(bits / 8)));
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return (v & ((1n << BigInt(bits)) - 1n)) | (1n << BigInt(bits - 1)) | 1n;
}
export function genPrime(bits: number, ok: (p: bigint) => boolean = () => true) {
  for (;;) { const c = randBig(bits); if (isPrime(c) && ok(c)) return c; }
}
export function keygen(nBits: number, e = 65537n) {
  for (;;) {
    const p = genPrime(nBits >> 1), q = genPrime(nBits >> 1);
    if (p === q) continue;
    const phi = (p - 1n) * (q - 1n);
    if (gcd(e, phi) !== 1n) continue;
    return { p, q, n: p * q, e, d: modinv(e, phi) };
  }
}
/** Chinese Remainder Theorem: x ≡ r_i (mod n_i) for pairwise coprime n_i. */
export function crt(rs: bigint[], ns: bigint[]) {
  const N = ns.reduce((a, b) => a * b, 1n);
  let x = 0n;
  rs.forEach((r, i) => { const Ni = N / ns[i]; x += r * Ni * modinv(Ni, ns[i]); });
  return x % N;
}
/** Integer k-th root by Newton's method. */
export function iroot(x: bigint, k: bigint) {
  if (x < 2n) return x;
  let r = 1n << BigInt(Math.ceil(x.toString(2).length / Number(k)) + 1);
  for (;;) {
    const t = ((k - 1n) * r + x / r ** (k - 1n)) / k;
    if (t >= r) return r;
    r = t;
  }
}
export const toBig = (b: Uint8Array) => b.reduce((a, v) => (a << 8n) | BigInt(v), 0n);
export function toBytes(v: bigint, len?: number) {
  const out: number[] = [];
  while (v > 0n) { out.unshift(Number(v & 255n)); v >>= 8n; }
  while (len && out.length < len) out.unshift(0);
  return Uint8Array.from(out);
}
export const textToBig = (s: string) => toBig(new TextEncoder().encode(s));
export const bigToText = (v: bigint) => new TextDecoder("utf-8", { fatal: false }).decode(toBytes(v));
