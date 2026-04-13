import crypto from 'crypto';

function getKey(): Buffer {
  const raw = process.env.MARKETING_WALLET_ENCRYPTION_KEY || '';
  const key = raw.trim();
  if (!key) throw new Error('MARKETING_WALLET_ENCRYPTION_KEY missing');
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptWallet(rawWallet: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(rawWallet, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptWallet(cipherText: string): string {
  const raw = String(cipherText || '');
  if (!raw.startsWith('enc:')) return raw;
  const parts = raw.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted wallet format');
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return plain;
}
