import fs from 'fs'
import path from 'path'

const dialogDir = path.resolve(process.cwd(), 'webapp/components/ai/UserAiSettingsPanel/ProviderDialog')

const read = (file: string): string => fs.readFileSync(path.join(dialogDir, file), 'utf8')

// the FormItem tags (up to the end of the opening tag) of a source
const getFormItems = (source: string): string[] => source.match(/<FormItem\b[^>]*>/g) ?? []

describe('provider dialog input labels (443)', () => {
  const files = fs.readdirSync(dialogDir).filter((file) => file.endsWith('.tsx'))

  test('the dialog has fields to label', () => {
    const count = files.reduce((total, file) => total + getFormItems(read(file)).length, 0)
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test.each(files)('%s: every FormItem names its input with htmlFor (a visible label is not enough)', (file) => {
    for (const tag of getFormItems(read(file))) {
      expect([tag, /htmlFor=/.test(tag)]).toEqual([tag, true])
    }
  })

  test('the label of a field points to an id the field sets', () => {
    for (const file of files) {
      const source = read(file)
      for (const [, target] of source.matchAll(/htmlFor=\{([\w.]+)\}/g)) {
        const idSets = source.split(`id={${target}}`).length - 1
        expect([file, target, idSets > 0]).toEqual([file, target, true])
      }
    }
  })
})
