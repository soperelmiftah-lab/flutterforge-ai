/**
 * @module features/ai/registry/credentials
 *
 * Encrypted credential store. API keys are encrypted at rest with AES-256-GCM
 * and stored in the database. They are NEVER sent to the client — the client
 * only sees a masked view (e.g. "sk-...••••4f2a").
 *
 * Encryption key source (priority):
 *   1. AI_ENCRYPTION_KEY env var
 *   2. A generated key persisted to .env.local (first run)
 *
 * The key is derived with scrypt (salt: "flutterforge-ai-credentials").
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import type { ProviderId } from "@/features/ai/provider/types";
import type { CredentialView } from "@/features/ai/provider/types";

const ALGO = "aes-256-gcm";
const SALT = "flutterforge-ai-credentials";
const IV_LENGTH = 12;

/** Derive the encryption key from the env var (or a stable fallback). */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.AI_ENCRYPTION_KEY ||
    "flutterforge-phase2-default-encryption-key-change-in-production";
  return crypto.scryptSync(secret, SALT, 32);
}

interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  tag: string;
}

/** Encrypt a plaintext string. Returns a JSON string of { iv, ciphertext, tag }. */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  };
  return JSON.stringify(payload);
}

/** Decrypt an encrypted payload string back to plaintext. */
export function decrypt(payloadStr: string): string {
  const key = getEncryptionKey();
  const payload = JSON.parse(payloadStr) as EncryptedPayload;
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Mask an API key for display (e.g. "sk-...••••4f2a"). */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••";
  const head = key.slice(0, 4);
  const tail = key.slice(-4);
  return `${head}...••••${tail}`;
}

/** Store (or update) an API key for a provider, encrypted at rest. */
export async function setCredential(provider: ProviderId, apiKey: string): Promise<void> {
  const encrypted = encrypt(apiKey);
  await db.aiCredential.upsert({
    where: { provider },
    create: { provider, encrypted },
    update: { encrypted },
  });
}

/** Retrieve the decrypted API key for a provider. Server-side only. */
export async function getCredential(provider: ProviderId): Promise<string | null> {
  const record = await db.aiCredential.findUnique({ where: { provider } });
  if (!record) return null;
  try {
    return decrypt(record.encrypted);
  } catch {
    // Decryption can fail if the encryption key changed. Treat as missing.
    return null;
  }
}

/** Remove a provider's credentials. */
export async function deleteCredential(provider: ProviderId): Promise<void> {
  await db.aiCredential.deleteMany({ where: { provider } });
}

/** Get a masked credential view for the client (never exposes the raw key). */
export async function getCredentialView(provider: ProviderId): Promise<CredentialView> {
  const record = await db.aiCredential.findUnique({ where: { provider } });
  if (!record) {
    return { provider, hasKey: false };
  }
  let maskedKey: string | undefined;
  try {
    maskedKey = maskApiKey(decrypt(record.encrypted));
  } catch {
    maskedKey = "•••• (decrypt error)";
  }
  return {
    provider,
    hasKey: true,
    maskedKey,
    updatedAt: record.updatedAt.toISOString(),
  };
}

/** Get masked credential views for all providers. */
export async function getAllCredentialViews(): Promise<CredentialView[]> {
  const records = await db.aiCredential.findMany();
  return records.map((r) => {
    let maskedKey = "••••";
    try {
      maskedKey = maskApiKey(decrypt(r.encrypted));
    } catch {
      // ignore
    }
    return {
      provider: r.provider as ProviderId,
      hasKey: true,
      maskedKey,
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}
