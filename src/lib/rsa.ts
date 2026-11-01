/** Textbook RSA on BigInt, plus the attacks that break it. No padding on purpose. */
export const modpow = (b: bigint, e: bigint, m: bigint) => {
  let r = 1n; b %= m;
  while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; b = (b * b) % m; }
  return r;
};
export const gcd = (a: bigint, b: bigint): bigint => { while (b) [a, b] = [b, a % b]; return a; };
export function modinv(a: bigint, m: bigint) {
  let [r0, r1, s0, s1] = [a, m, 1n, 0n];
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
function randBits(bits: number) {
  const bytes = new Uint8Array(Math.ceil(bits / 8));
  crypto.getRandomValues(bytes);
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  v &= (1n << BigInt(bits)) - 1n;
  return v | (1n << BigInt(bits - 1)) | 1n;
}
export function genPrime(bits: number) { for (;;) { const c = randBits(bits); if (isPrime(c)) return c; } }

export function keygen(nBits: number) {
  const e = 65537n;
  for (;;) {
    const p = genPrime(nBits >> 1), q = genPrime(nBits - (nBits >> 1));
    if (p === q) continue;
    const phi = (p - 1n) * (q - 1n);
    if (gcd(e, phi) !== 1n) continue;
    return { p, q, n: p * q, e, d: modinv(e, phi) };
  }
}

/** Pollard-Brent factoring. Cost is about sqrt(smallest prime) = 2^(bits/4) steps. */
export function factor(n: bigint, cap = 6_000_000) {
  let iters = 0;
  for (let c = 1n; c < 12n; c++) {
    const f = (v: bigint) => (v * v + c) % n;
    let y = 2n, x = 0n, ys = 0n, q = 1n, g = 1n, r = 1;
    do {
      x = y;
      for (let i = 0; i < r; i++) y = f(y);
      let k = 0;
      do {
        ys = y;
        for (let i = 0; i < Math.min(128, r - k); i++) { y = f(y); q = (q * (x > y ? x - y : y - x)) % n; iters++; }
        g = gcd(q, n); k += 128;
      } while (k < r && g === 1n);
      r *= 2;
      if (iters > cap) return { p: null as bigint | null, iters };
    } while (g === 1n);
    if (g === n) do { ys = f(ys); g = gcd(x > ys ? x - ys : ys - x, n); } while (g === 1n);
    if (g !== n) return { p: g, iters };
  }
  return { p: null as bigint | null, iters };
}

export const toBig = (s: string) => [...new TextEncoder().encode(s)].reduce((a, b) => (a << 8n) | BigInt(b), 0n);
export function fromBig(v: bigint) {
  const bytes: number[] = [];
  while (v > 0n) { bytes.unshift(Number(v & 255n)); v >>= 8n; }
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
}
