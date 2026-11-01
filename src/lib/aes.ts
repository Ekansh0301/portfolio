/** AES-128 from the spec: S-box generated from GF(2^8), key schedule, rounds. ECB and CTR on top. */
const rotl = (x: number, s: number) => ((x << s) | (x >> (8 - s))) & 0xff;
const SBOX = (() => {
  const s = new Uint8Array(256);
  let p = 1, q = 1;
  do {
    p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0); // p *= 3
    q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;   // q /= 3
    if (q & 0x80) q ^= 0x09;
    s[p] = (q ^ rotl(q, 1) ^ rotl(q, 2) ^ rotl(q, 3) ^ rotl(q, 4) ^ 0x63) & 0xff;
  } while (p !== 1);
  s[0] = 0x63;
  return s;
})();
const xt = (a: number) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;

function expand(key: Uint8Array) {
  const w = new Uint8Array(176);
  w.set(key);
  let rcon = 1;
  for (let i = 16; i < 176; i += 4) {
    let t = [w[i - 4], w[i - 3], w[i - 2], w[i - 1]];
    if (i % 16 === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xt(rcon); }
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 16 + j] ^ t[j];
  }
  return w;
}

export function encryptBlock(block: Uint8Array, rk: Uint8Array) {
  const s = Uint8Array.from(block);
  const add = (r: number) => { for (let i = 0; i < 16; i++) s[i] ^= rk[r * 16 + i]; };
  add(0);
  for (let r = 1; r <= 10; r++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const o = Uint8Array.from(s);                       // ShiftRows (column-major state)
    for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) s[row + 4 * c] = o[row + 4 * ((c + row) % 4)];
    if (r < 10) for (let c = 0; c < 4; c++) {            // MixColumns
      const [a0, a1, a2, a3] = [s[4 * c], s[4 * c + 1], s[4 * c + 2], s[4 * c + 3]];
      s[4 * c] = xt(a0) ^ xt(a1) ^ a1 ^ a2 ^ a3;
      s[4 * c + 1] = a0 ^ xt(a1) ^ xt(a2) ^ a2 ^ a3;
      s[4 * c + 2] = a0 ^ a1 ^ xt(a2) ^ xt(a3) ^ a3;
      s[4 * c + 3] = xt(a0) ^ a0 ^ a1 ^ a2 ^ xt(a3);
    }
    add(r);
  }
  return s;
}

export const keySchedule = expand;

export function ecb(data: Uint8Array, key: Uint8Array) {
  const rk = expand(key), out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 16) out.set(encryptBlock(data.subarray(i, i + 16), rk), i);
  return out;
}

export function ctr(data: Uint8Array, key: Uint8Array, nonce: Uint8Array) {
  const rk = expand(key), out = new Uint8Array(data.length);
  const ctrBlock = new Uint8Array(16);
  ctrBlock.set(nonce.subarray(0, 8));
  for (let i = 0, n = 0; i < data.length; i += 16, n++) {
    for (let b = 0; b < 8; b++) ctrBlock[15 - b] = Math.floor(n / 256 ** b) & 0xff;
    const ks = encryptBlock(ctrBlock, rk);
    for (let j = 0; j < 16 && i + j < data.length; j++) out[i + j] = data[i + j] ^ ks[j];
  }
  return out;
}
