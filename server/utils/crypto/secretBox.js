/**
 * AES-256-GCM authenticated encryption for small at-rest secrets
 * (e.g. user-supplied LLM API keys stored inside `user.prefs.ai`).
 *
 * Envelope format: `v1:<base64(iv | tag | ciphertext)>` where the IV is 12
 * bytes and the auth tag is 16 bytes. The version prefix lets us rotate
 * keys or algorithms later without breaking existing ciphertexts.
 *
 * Master key is read from `ENV.aiUserKeyEncryptionSecret` (a 32-byte hex
 * string). The hex is decoded eagerly on first use so misconfiguration
 * fails loudly at first encrypt/decrypt call rather than silently.
 */
import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16
const VERSION = 'v1'

// process.env is read at every call so that tests can swap the key in
// `beforeAll`, and so that an admin can update the deployment without a
// restart having to re-import every module that depends on us.
let cachedHex = null
let cachedKey = null

const getKey = () => {
  const hex = process.env.AI_USER_KEY_ENCRYPTION_SECRET
  if (cachedKey && cachedHex === hex) return cachedKey
  if (!hex) {
    throw new Error('AI_USER_KEY_ENCRYPTION_SECRET is not set; cannot encrypt or decrypt user AI keys')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('AI_USER_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)')
  }
  cachedHex = hex
  cachedKey = Buffer.from(hex, 'hex')
  return cachedKey
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM and returns a versioned envelope.
 * @param {string} plain - The plaintext string to encrypt.
 * @returns {string} Versioned ciphertext envelope, e.g. "v1:<base64>".
 */
export const encrypt = (plain) => {
  if (typeof plain !== 'string') {
    throw new TypeError('secretBox.encrypt expects a string')
  }
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, ciphertext])
  return `${VERSION}:${payload.toString('base64')}`
}

/**
 * Decrypts a versioned envelope produced by {@link encrypt}.
 * @param {string} envelope - The "v1:<base64>" envelope.
 * @returns {string} The decrypted plaintext.
 * @throws {Error} If the envelope version is unknown, the ciphertext is
 *   malformed, or the auth tag does not match (tampering or wrong key).
 */
export const decrypt = (envelope) => {
  if (typeof envelope !== 'string' || !envelope.includes(':')) {
    throw new Error('secretBox.decrypt: malformed envelope')
  }
  const [version, b64] = envelope.split(':', 2)
  if (version !== VERSION) {
    throw new Error(`secretBox.decrypt: unsupported version "${version}"`)
  }
  const buf = Buffer.from(b64, 'base64')
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('secretBox.decrypt: payload too short')
  }
  const key = getKey()
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}

/**
 * Returns true if the master key looks valid. Useful for startup probes
 * without throwing.
 * @returns {boolean} True when the encryption secret is present and well-formed.
 */
export const isConfigured = () => {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}
