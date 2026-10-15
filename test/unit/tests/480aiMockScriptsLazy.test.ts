import fs from 'fs'
import path from 'path'

import { createMockModel } from '@server/modules/ai/service/mockProvider'

const serviceDir = path.resolve(__dirname, '../../../server/modules/ai/service')

describe('the e2e mock scripts load only on demand (480)', () => {
  test('no file outside the mock folder imports the scripts statically', () => {
    const offenders = fs
      .readdirSync(serviceDir, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && !file.startsWith('mock/'))
      .filter((file) =>
        /^\s*(import|export)\b[^;]*\bfrom\s+['"][^'"]*mock\/mockScripts[^'"]*['"]/m.test(
          fs.readFileSync(path.join(serviceDir, file), 'utf8')
        )
      )
    expect(offenders).toEqual([])
  })

  test('the mock model imports the scripts with a dynamic import', () => {
    const source = fs.readFileSync(path.join(serviceDir, 'mockProvider.ts'), 'utf8')
    expect(source).toMatch(/import\('\.\/mock\/mockScripts'\)/)
  })

  test('the mock model still answers a fixed text without loading the scripts', async () => {
    const model = createMockModel({ text: 'fixed' })
    const result = await model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] })
    expect(result.content).toEqual([{ type: 'text', text: 'fixed' }])
  })

  test('the mock model plays a scripted step after loading the scripts', async () => {
    const model = createMockModel()
    const result = await model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] })
    expect(result.content).toEqual([{ type: 'text', text: 'MOCK answer.' }])
  })
})
