import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

function secret() {
  const value = process.env.PII_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("PII_ENCRYPTION_NOT_CONFIGURED");
  return value;
}

function encryptionKey() {
  return createHash("sha256").update(secret()).digest();
}

export function normalizeIdentityNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function encryptIdentityNumber(value: string) {
  const normalized = normalizeIdentityNumber(value);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptIdentityNumber(value: string) {
  const [ivValue,tagValue,encryptedValue]=value.split(".");
  if(!ivValue||!tagValue||!encryptedValue) throw new Error("INVALID_ENCRYPTED_VALUE");
  const decipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(ivValue,"base64url"));
  decipher.setAuthTag(Buffer.from(tagValue,"base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue,"base64url")),decipher.final()]).toString("utf8");
}

export function identityBlindIndex(value: string) {
  return createHmac("sha256", secret()).update(normalizeIdentityNumber(value)).digest("hex");
}

export function lastFour(value: string) {
  return normalizeIdentityNumber(value).slice(-4);
}

export function maskedIdentity(last4: string) {
  return `•••• •••• •••• ${last4}`;
}
