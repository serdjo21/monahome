// src/server/auth/totp.ts
import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * TOTP (RFC 6238): šestocifreni kod koji se menja na 30 sekundi, isti kao u Google Authenticator-u.
 * Bez spoljnog paketa: HMAC-SHA1 iz Node-a, base32 za ključ.
 */
const STEP_SECONDS = 30;
const DIGITS = 6;
/** Prihvata i kod iz prethodnih i sledećih 30 sekundi (sat na telefonu malo kasni ili žuri). */
const WINDOW = 1;

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error("Neispravan base32 ključ.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hash = createHmac("sha1", key).update(message).digest();
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Novi tajni ključ (160 bita, base32), kao što ga očekuju aplikacije za autentifikaciju. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Kod za dati trenutak (za testove i proveru). */
export function totpAt(secret: string, time = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(time / 1000 / STEP_SECONDS));
}

/**
 * Proverava kod i vraća njegov korak (redni broj 30-sekundnog intervala), ili null.
 * Korak se čuva u bazi, da se isti kod ne može iskoristiti dva puta.
 */
export function matchTotp(secret: string, code: string, time = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const key = base32Decode(secret);
  const current = Math.floor(time / 1000 / STEP_SECONDS);
  for (let delta = -WINDOW; delta <= WINDOW; delta++) {
    if (safeEqual(hotp(key, current + delta), code)) return current + delta;
  }
  return null;
}

/** Link koji QR kod nosi; aplikacija iz njega čita naziv naloga i ključ. */
export function otpauthUrl(secret: string, email: string): string {
  const label = encodeURIComponent(`monahome:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=monahome&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

/** „ABCD EFGH …“ za ručni unos u aplikaciju. */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

// ─── Šifrovanje ključa u bazi ───────────────────────────────
// Ključ je u bazi šifrovan (AES-256-GCM), pa ni pristup bazi sam ne otkriva kodove.
// Ključ za šifrovanje izvodi se iz AUTH_SECRET: ako se AUTH_SECRET promeni, 2FA se mora podesiti ponovo.

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET nije postavljen.");
  return createHash("sha256").update(`monahome-totp:${secret}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Neispravan zapis 2FA ključa.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

// ─── Rezervni kodovi ────────────────────────────────────────

/** Bez slova i cifara koje se lako pobrkaju (0/o, 1/l/i). */
const BACKUP_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** „k7m2p-x9q4t“: deset znakova, prikazuju se jednom; u bazi je samo heš. */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(10);
    const chars = Array.from(bytes, (byte) => BACKUP_ALPHABET[byte % BACKUP_ALPHABET.length]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

/** Heš rezervnog koda; razmaci, crtica i velika slova se zanemaruju. */
export function hashBackupCode(code: string): string {
  const normalized = code.toLowerCase().replace(/[\s-]/g, "");
  return createHash("sha256").update(`monahome-backup:${normalized}`).digest("hex");
}