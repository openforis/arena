import * as SecretBox from '@server/utils/crypto/secretBox'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'

const KEY_HEX = 'b'.repeat(64)
const AAD = 'user-1|acct:a|openai-compatible|https://llm.example.org/v1'

describe('secretBox AAD and legacy envelopes (301)', () => {
  let originalKey: string | undefined

  beforeAll(() => {
    originalKey = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_HEX
  })

  afterAll(() => {
    if (originalKey === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalKey
  })

  test('a ciphertext decrypts only with the AAD it was encrypted with', () => {
    const envelope = SecretBox.encrypt('sk-victim', AAD)
    expect(envelope.startsWith('v2:')).toBe(true)
    expect(SecretBox.decrypt(envelope, AAD)).toBe('sk-victim')
    // copied to another user, provider, type or endpoint
    for (const other of [
      'user-2|acct:a|openai-compatible|https://llm.example.org/v1',
      'user-1|acct:b|openai-compatible|https://llm.example.org/v1',
      'user-1|acct:a|openai|https://llm.example.org/v1',
      'user-1|acct:a|openai-compatible|https://attacker.example/v1',
      '',
    ]) {
      expect(() => SecretBox.decrypt(envelope, other)).toThrow()
    }
  })

  test('encrypt and decrypt of a v2 envelope need an AAD', () => {
    expect(() => SecretBox.encrypt('sk', '')).toThrow(TypeError)
    expect(() => SecretBox.encrypt('sk', undefined as any)).toThrow(TypeError)
    const envelope = SecretBox.encrypt('sk', AAD)
    expect(() => SecretBox.decrypt(envelope, undefined as any)).toThrow(TypeError)
    expect(() => SecretBox.decrypt(envelope, undefined as any, { allowLegacy: true })).toThrow(TypeError)
  })

  test('a legacy envelope (no AAD) is refused unless the caller allows it', () => {
    const envelope = legacyEnvelope('sk-old')
    expect(SecretBox.isLegacyEnvelope(envelope)).toBe(true)
    expect(() => SecretBox.decrypt(envelope, AAD)).toThrow(/version/)
    expect(SecretBox.decrypt(envelope, AAD, { allowLegacy: true })).toBe('sk-old')
  })

  test('new envelopes are not legacy', () => {
    expect(SecretBox.isLegacyEnvelope(SecretBox.encrypt('sk', AAD))).toBe(false)
    expect(SecretBox.isLegacyEnvelope(null)).toBe(false)
  })

  test('a v2 envelope cannot be passed off as a legacy one to skip the AAD', () => {
    const envelope = SecretBox.encrypt('sk-victim', AAD)
    const relabelled = `v1:${envelope.slice('v2:'.length)}`
    expect(() => SecretBox.decrypt(relabelled, AAD, { allowLegacy: true })).toThrow()
  })

  test('a different master key cannot decrypt (secret rotated)', () => {
    const envelope = SecretBox.encrypt('sk', AAD)
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = 'c'.repeat(64)
    try {
      expect(() => SecretBox.decrypt(envelope, AAD)).toThrow()
    } finally {
      process.env.AI_USER_KEY_ENCRYPTION_SECRET = KEY_HEX
    }
  })
})
