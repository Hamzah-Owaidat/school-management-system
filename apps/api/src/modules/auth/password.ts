import { hash, verify } from "@node-rs/argon2";

// Argon2id with @node-rs/argon2's defaults: memory 19 MiB, 2 iterations, parallelism 1 —
// the OWASP-recommended profile. No options are passed so a dependency bump can't silently
// weaken them without the changelog calling it out.

/** Hashes a password with Argon2id. Never store the raw password. */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/** Verifies a password against an Argon2id hash. */
export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}

let dummyHash: Promise<string> | undefined;

/** A real Argon2id hash of a fixed, unrelated password, computed once and cached. */
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("dummy-password-used-only-for-timing-safety");
  return dummyHash;
}

/**
 * Verifies against the real hash when there is one; otherwise still runs a full Argon2id
 * verify against a dummy hash and returns false, so the response time for "unknown email"
 * and "wrong password" can't be told apart (permissions.md threat S1).
 */
export async function verifyPasswordOrDummy(
  storedHash: string | null,
  password: string,
): Promise<boolean> {
  if (storedHash) return verifyPassword(storedHash, password);
  await verifyPassword(await getDummyHash(), password);
  return false;
}
