/**
 * Standalone smoke test for server/utils/crypto/secretBox.js. Runs without
 * the full webpack/jest pipeline so we can verify the encryption layer
 * even when @openforis packages can't be installed (the rest of the test
 * suite needs them to bundle).
 *
 * Run: node test/unit/standalone/secretBox.standalone.js
 *
 * Exits with code 0 on success, non-zero on any failed assertion.
 */
const assert = require('node:assert/strict')

process.env.AI_USER_KEY_ENCRYPTION_SECRET = 'a'.repeat(64)

// secretBox.js uses ESM-style imports. We load it via the eval/CJS bridge
// using a minimal transformation: strip the import / export keywords.
// Keeping this trivial because we only have one source file with one
// import (`crypto`) and a few `export const` declarations.
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'server', 'utils', 'crypto', 'secretBox.js'), 'utf8')

const cjs =
  src
    .replace(/^import\s+crypto\s+from\s+'crypto'\s*$/m, "const crypto = require('node:crypto')")
    .replace(/^export\s+const\s+/gm, 'const ')
    .replace(/^export\s+/gm, '') +
  `

module.exports = { encrypt, decrypt, isConfigured }
`

const m = new Module(path.join(__dirname, 'secretBox.virtual.js'))
m.filename = path.join(__dirname, 'secretBox.virtual.js')
m.paths = Module._nodeModulePaths(m.filename)
m._compile(cjs, m.filename)
const SecretBox = m.exports

let pass = 0
let fail = 0
const ok = (name, fn) => {
  try {
    fn()
    pass++
    process.stdout.write(`ok   ${name}\n`)
  } catch (e) {
    fail++
    process.stdout.write(`FAIL ${name}\n     ${e?.message || e}\n`)
  }
}

ok('round-trips a short ASCII string', () => {
  const plain = 'sk-test-1234567890'
  const cipher = SecretBox.encrypt(plain)
  assert.equal(cipher.startsWith('v1:'), true)
  assert.equal(SecretBox.decrypt(cipher), plain)
})

ok('round-trips an empty-ish and a long string', () => {
  assert.equal(SecretBox.decrypt(SecretBox.encrypt(' ')), ' ')
  const long = 'x'.repeat(4096)
  assert.equal(SecretBox.decrypt(SecretBox.encrypt(long)), long)
})

ok('round-trips multibyte UTF-8', () => {
  const plain = 'token-清-🌳-é'
  assert.equal(SecretBox.decrypt(SecretBox.encrypt(plain)), plain)
})

ok('produces a different envelope each call (random IV)', () => {
  const a = SecretBox.encrypt('sk-deterministic')
  const b = SecretBox.encrypt('sk-deterministic')
  assert.notEqual(a, b)
})

ok('rejects malformed envelopes', () => {
  assert.throws(() => SecretBox.decrypt('not-an-envelope'))
  assert.throws(() => SecretBox.decrypt(''))
  assert.throws(() => SecretBox.decrypt('v1:'))
})

ok('rejects unknown version prefix', () => {
  const cipher = SecretBox.encrypt('hello')
  const tampered = `v9:${cipher.slice(3)}`
  assert.throws(() => SecretBox.decrypt(tampered), /version/)
})

ok('rejects tampered ciphertext (auth tag fails)', () => {
  const cipher = SecretBox.encrypt('hello')
  const head = cipher.slice(0, -2)
  const tail = cipher.slice(-2)
  const flippedTail = tail === 'aa' ? 'bb' : 'aa'
  assert.throws(() => SecretBox.decrypt(head + flippedTail))
})

ok('encrypt rejects non-string input', () => {
  assert.throws(() => SecretBox.encrypt(123), TypeError)
  assert.throws(() => SecretBox.encrypt(null), TypeError)
})

ok('isConfigured returns true with a valid key', () => {
  assert.equal(SecretBox.isConfigured(), true)
})

ok('isConfigured returns false without a key', () => {
  const prev = process.env.AI_USER_KEY_ENCRYPTION_SECRET
  delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
  try {
    assert.equal(SecretBox.isConfigured(), false)
  } finally {
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = prev
  }
})

ok('rejects malformed master key', () => {
  const prev = process.env.AI_USER_KEY_ENCRYPTION_SECRET
  process.env.AI_USER_KEY_ENCRYPTION_SECRET = 'not-hex'
  try {
    assert.throws(() => SecretBox.encrypt('x'), /64-character hex/)
  } finally {
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = prev
  }
})

process.stdout.write(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
