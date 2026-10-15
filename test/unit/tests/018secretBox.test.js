/**
 * Tests for the AES-256-GCM secretBox utility used to protect user-supplied
 * LLM API keys at rest. The master key is set directly on process.env so
 * the tests can run without any deployment-level configuration; secretBox
 * reads process.env on every call, so the swap takes effect immediately.
 */
import * as SecretBox from '@server/utils/crypto/secretBox'

const TEST_KEY_HEX = 'a'.repeat(64)
const AAD = 'user-1|acct:a|openai|'

describe('secretBox (AES-256-GCM, v2 envelope)', () => {
  let originalKey

  beforeAll(() => {
    originalKey = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = TEST_KEY_HEX
  })

  afterAll(() => {
    if (originalKey === undefined) {
      delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    } else {
      process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalKey
    }
  })

  test('round-trips a short ASCII string', () => {
    const plain = 'sk-test-1234567890'
    const cipher = SecretBox.encrypt(plain, AAD)
    expect(cipher.startsWith('v2:')).toBe(true)
    expect(SecretBox.decrypt(cipher, AAD)).toBe(plain)
  })

  test('round-trips an empty-ish string and a long string', () => {
    const short = ' '
    const long = 'x'.repeat(4096)
    expect(SecretBox.decrypt(SecretBox.encrypt(short, AAD), AAD)).toBe(short)
    expect(SecretBox.decrypt(SecretBox.encrypt(long, AAD), AAD)).toBe(long)
  })

  test('round-trips a UTF-8 string with multibyte characters', () => {
    const plain = 'token-清-🌳-é'
    expect(SecretBox.decrypt(SecretBox.encrypt(plain, AAD), AAD)).toBe(plain)
  })

  test('produces a different envelope each call (random IV)', () => {
    const plain = 'sk-deterministic'
    const a = SecretBox.encrypt(plain, AAD)
    const b = SecretBox.encrypt(plain, AAD)
    expect(a).not.toBe(b)
  })

  test('decrypt rejects malformed envelopes', () => {
    expect(() => SecretBox.decrypt('not-an-envelope', AAD)).toThrow()
    expect(() => SecretBox.decrypt('', AAD)).toThrow()
    expect(() => SecretBox.decrypt('v2:', AAD)).toThrow()
  })

  test('decrypt rejects unknown version prefix', () => {
    const cipher = SecretBox.encrypt('hello', AAD)
    const tampered = `v9:${cipher.slice(3)}`
    expect(() => SecretBox.decrypt(tampered, AAD)).toThrow(/version/)
  })

  test('decrypt rejects tampered ciphertext (auth tag fails)', () => {
    const cipher = SecretBox.encrypt('hello', AAD)
    // flip a byte near the end (within the ciphertext region) to trip the GCM tag
    const head = cipher.slice(0, -2)
    const tail = cipher.slice(-2)
    const flippedTail = tail === 'aa' ? 'bb' : 'aa'
    expect(() => SecretBox.decrypt(head + flippedTail, AAD)).toThrow()
  })

  test('encrypt rejects non-string input', () => {
    expect(() => SecretBox.encrypt(123, AAD)).toThrow(TypeError)
    expect(() => SecretBox.encrypt(null, AAD)).toThrow(TypeError)
  })

  test('isConfigured reports true when the master key is well-formed', () => {
    expect(SecretBox.isConfigured()).toBe(true)
  })
})
