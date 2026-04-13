import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import type { Hex } from 'viem';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;

function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return scryptSync(masterSecret, salt, KEY_LEN);
}

export function encryptHexPrivateKey(privateKeyHex: Hex, userId: string, masterSecret: string): {
  ciphertextB64: string;
  ivB64: string;
  authTagB64: string;
  saltB64: string;
} {
  const salt = randomBytes(16);
  const key = deriveKey(`${masterSecret}:${userId}`, salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const pk = (privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(pk)) throw new Error('invalid_private_key_hex');
  const enc = Buffer.concat([cipher.update(Buffer.from(pk, 'hex')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertextB64: enc.toString('base64'),
    ivB64: iv.toString('base64'),
    authTagB64: authTag.toString('base64'),
    saltB64: salt.toString('base64'),
  };
}

export function decryptHexPrivateKey(
  ciphertextB64: string,
  ivB64: string,
  authTagB64: string,
  saltB64: string,
  userId: string,
  masterSecret: string,
): Hex {
  const salt = Buffer.from(saltB64, 'base64');
  const key = deriveKey(`${masterSecret}:${userId}`, salt);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]);
  const hex = dec.toString('hex').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hex)) throw new Error('decrypt_invalid');
  return `0x${hex}` as Hex;
}
