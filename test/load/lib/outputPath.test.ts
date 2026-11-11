import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { resolveValidatedOutputPath } from './outputPath.ts'

const FAKE_CWD = '/repo/checkout'

test('resolveValidatedOutputPath allows a relative path within the given cwd', () => {
  const resolved = resolveValidatedOutputPath('sample-survey.zip', FAKE_CWD)
  assert.equal(resolved, path.join(FAKE_CWD, 'sample-survey.zip'))
})

test('resolveValidatedOutputPath allows a nested relative path within the given cwd', () => {
  const resolved = resolveValidatedOutputPath('./tmp/sample-survey.zip', FAKE_CWD)
  assert.equal(resolved, path.join(FAKE_CWD, 'tmp/sample-survey.zip'))
})

test('resolveValidatedOutputPath allows an absolute path under the real OS temp directory', () => {
  const realTmpDir = fs.realpathSync(os.tmpdir())
  const target = path.join(realTmpDir, 'sample-survey.zip')
  const resolved = resolveValidatedOutputPath(target, FAKE_CWD)
  assert.equal(resolved, target)
})

test('resolveValidatedOutputPath allows the cwd itself (boundary case)', () => {
  const resolved = resolveValidatedOutputPath('.', FAKE_CWD)
  assert.equal(resolved, FAKE_CWD)
})

test('resolveValidatedOutputPath rejects a path traversal that escapes the cwd', () => {
  assert.throws(() => resolveValidatedOutputPath('../../../etc/passwd', FAKE_CWD), /Refusing to write outside/)
})

test('resolveValidatedOutputPath rejects an absolute path outside both allowed roots', () => {
  assert.throws(() => resolveValidatedOutputPath('/etc/passwd', FAKE_CWD), /Refusing to write outside/)
})

test('resolveValidatedOutputPath does not treat a sibling directory sharing a name prefix as inside the cwd', () => {
  // e.g. cwd "/repo/checkout" must not accept "/repo/checkout-evil/x.zip" just because the string
  // starts with "/repo/checkout" -- the path.sep-boundary check in the implementation guards this.
  assert.throws(() => resolveValidatedOutputPath('/repo/checkout-evil/x.zip', FAKE_CWD), /Refusing to write outside/)
})
