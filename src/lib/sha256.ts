/** SHA-256 and HMAC-SHA256, constants derived from the primes as in FIPS 180-4. */
const primes: number[] = [];
for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);
const frac = (x: number) => Math.floor((x - Math.floor(x)) * 2 ** 32) >>> 0;
const K = primes.map((p) => frac(Math.cbrt(p)));
const H0 = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export function sha256(data: Uint8Array): Uint8Array {
  const l = data.length;
  const padLen = ((l + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(padLen);
  buf.set(data); buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(padLen - 4, (l * 8) >>> 0);
  dv.setUint32(padLen - 8, Math.floor((l * 8) / 2 ** 32));
  const h = Uint32Array.from(H0), w = new Uint32Array(64);
  for (let o = 0; o < padLen; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  h.forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

export function hmac(key: Uint8Array, msg: Uint8Array) {
  let k = key.length > 64 ? sha256(key) : key;
  const kp = new Uint8Array(64); kp.set(k);
  const ipad = kp.map((b) => b ^ 0x36), opad = kp.map((b) => b ^ 0x5c);
  const inner = sha256(Uint8Array.from([...ipad, ...msg]));
  return sha256(Uint8Array.from([...opad, ...inner]));
}
