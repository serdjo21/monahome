import "server-only";

import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

// Heš lozinke koja ne postoji: kad nalog ne postoji, i dalje se radi poređenje,
// pa se po vremenu odgovora ne može zaključiti da li je e-mail registrovan.
const DUMMY_HASH = "$2b$12$3Vd5aWWCCD0ChBfN1qYhiuuZE5tzGNgsAYHEkgEvY747TD.zqD9Ge";

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const valid = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return Boolean(hash) && valid;
}

/** Nasumičan token za link u mejlu i njegov SHA-256 heš za bazu. */
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}