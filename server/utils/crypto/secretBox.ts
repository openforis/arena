/**
 * AES-256-GCM authenticated encryption for small at-rest secrets (e.g. the LLM API keys of a user, stored inside
 * `user.prefs.ai`).
 *
 * Envelope: `v2:<base64(iv | tag | ciphertext)>` with a 12-byte IV and a 16-byte tag. The caller gives an AAD (a
 * string that names who and what the secret belongs to, e.g. user, provider and endpoint): it is authenticated with
 * the ciphertext but not stored, so an envelope copied to another owner or endpoint fails to decrypt.
 *
 * `v1` envelopes (no AAD) were written before the AAD existed. They decrypt only when the caller asks for it
 * (`allowLegacy`), which is for a secret read from its owner's own stored record; nothing new is written as `v1`.
 *
 * The master key is read from `AI_USER_KEY_ENCRYPTION_SECRET` (a 64-character hex string, 32 bytes) at every call, so
 * a misconfiguration fails loudly at the first use, and tests and deployments can swap the key without a restart.
 */
import crypto from 'node:crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16
const VERSION = 'v2'
const LEGACY_VERSION = 'v1'

export type DecryptOptions = {
  // accept an envelope without AAD (written before the AAD existed)
  allowLegacy?: boolean
}

let cachedHex: string | undefined
let cachedKey: Buffer | null = null

/**
 * Returns the master key.
 * @returns {Buffer} The 32-byte key.
 * @throws {Error} When the secret is missing or not a 64-character hex string.
 */
const getKey = (): Buffer => {
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
 * Throws unless the AAD is a non-empty string.
 * @param {unknown} aad - Additional authenticated data.
 * @returns {void}
 */
function assertAad(aad: unknown): asserts aad is string {
  if (typeof aad !== 'string' || aad.length === 0) {
    throw new TypeError('secretBox: an AAD string is required')
  }
}

/**
 * Splits an envelope into its version and payload.
 * @param {unknown} envelope - The envelope.
 * @returns {{version: string, payload: Buffer}} The parts.
 * @throws {Error} When the envelope is malformed.
 */
const parseEnvelope = (envelope: unknown): { version: string; payload: Buffer } => {
  if (typeof envelope !== 'string' || !envelope.includes(':')) {
    throw new Error('secretBox.decrypt: malformed envelope')
  }
  const separator = envelope.indexOf(':')
  return { version: envelope.slice(0, separator), payload: Buffer.from(envelope.slice(separator + 1), 'base64') }
}

/**
 * Returns true when the envelope was written without AAD (an old `v1` envelope).
 * @param {unknown} envelope - The envelope.
 * @returns {boolean} Whether it is a legacy envelope.
 */
export const isLegacyEnvelope = (envelope: unknown): boolean =>
  typeof envelope === 'string' && envelope.startsWith(`${LEGACY_VERSION}:`)

/**
 * Encrypts a UTF-8 string with AES-256-GCM, bound to the AAD, and returns a versioned envelope.
 * @param {string} plain - The plaintext string to encrypt.
 * @param {string} aad - Names the owner of the secret; the same string is needed to decrypt.
 * @returns {string} Versioned ciphertext envelope, e.g. "v2:<base64>".
 */
export const encrypt = (plain: string, aad: string): string => {
  if (typeof plain !== 'string') {
    throw new TypeError('secretBox.encrypt expects a string')
  }
  assertAad(aad)
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  cipher.setAAD(Buffer.from(aad, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}:${Buffer.concat([iv, tag, ciphertext]).toString('base64')}`
}

/**
 * Decrypts a versioned envelope produced by {@link encrypt}.
 * @param {string} envelope - The "v2:<base64>" envelope (a "v1:" one only with `allowLegacy`).
 * @param {string} aad - The AAD the envelope was encrypted with.
 * @param {object} [options] - Options.
 * @param {boolean} [options.allowLegacy] - Accept an envelope without AAD (the `aad` is then not checked).
 * @returns {string} The decrypted plaintext.
 * @throws {Error} If the version is unknown (or legacy and not allowed), the payload is malformed, or the auth tag
 *   does not match (tampering, another AAD or another key).
 */
export const decrypt = (envelope: string, aad: string, { allowLegacy = false }: DecryptOptions = {}): string => {
  const { version, payload } = parseEnvelope(envelope)
  const legacy = version === LEGACY_VERSION
  if (version !== VERSION && !(legacy && allowLegacy)) {
    throw new Error(`secretBox.decrypt: unsupported version "${version}"`)
  }
  if (!legacy) assertAad(aad)
  if (payload.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('secretBox.decrypt: payload too short')
  }
  const decipher = crypto.createDecipheriv(ALGO, getKey(), payload.subarray(0, IV_LEN))
  decipher.setAuthTag(payload.subarray(IV_LEN, IV_LEN + TAG_LEN))
  if (!legacy) decipher.setAAD(Buffer.from(aad, 'utf8'))
  const plain = Buffer.concat([decipher.update(payload.subarray(IV_LEN + TAG_LEN)), decipher.final()])
  return plain.toString('utf8')
}

/**
 * Returns true if the master key looks valid. Useful for startup probes without throwing.
 * @returns {boolean} True when the encryption secret is present and well-formed.
 */
export const isConfigured = (): boolean => {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}
