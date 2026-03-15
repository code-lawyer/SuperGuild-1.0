/**
 * Server-side AES-256-GCM encryption for PII fields (contact_email, contact_telegram).
 *
 * Key source: ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Format: "v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * Prefix allows future algorithm migration without data loss.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'v1:';

function getKey(): Buffer {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error(
            'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    return Buffer.from(hex, 'hex');
}

export function encryptPII(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPII(ciphertext: string): string {
    if (!ciphertext.startsWith(PREFIX)) {
        // Plaintext (legacy data before encryption was added) — return as-is
        return ciphertext;
    }

    const key = getKey();
    const rest = ciphertext.slice(PREFIX.length);
    const parts = rest.split(':');
    if (parts.length !== 3) throw new Error('Invalid ciphertext format');

    const [ivHex, tagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Returns true if the value is already encrypted (has the v1: prefix). */
export function isEncrypted(value: string | null): boolean {
    return typeof value === 'string' && value.startsWith(PREFIX);
}
