import crypto from 'node:crypto'

/**
 * Builds a `v1` envelope the way the code did before the AAD existed (no AAD), with the secret of the environment.
 * @param {string} plain - Plaintext.
 * @returns {string} The legacy envelope.
 */
export const legacyEnvelope = (plain: string): string => {
  const iv = crypto.randomBytes(12)
  const key = Buffer.from(process.env.AI_USER_KEY_ENCRYPTION_SECRET as string, 'hex')
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')}`
}
