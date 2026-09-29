import { appendFile, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { SystemLogResetReasons } from '@common/systemLog/systemLogConstants'
import { LogFileTail, readLastLines } from '@server/modules/systemLog/service/logFileTail'

const toLines = (count: number, prefix = 'line') =>
  Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`)
const toText = (lines: string[]) => lines.map((line) => `${line}\n`).join('')

const createTail = async (filePath: string, { maxBytesPerRead = undefined } = {}) => {
  const { offset, ino } = await readLastLines({ filePath, maxLines: 10 })
  const received: string[] = []
  const resets: string[] = []
  const tail = new LogFileTail({
    filePath,
    offset,
    ino,
    maxBytesPerRead,
    onLines: (lines) => received.push(...lines),
    onReset: (reason) => resets.push(reason),
    onError: (error) => {
      throw error
    },
  })
  return { tail, received, resets }
}

describe('System log file tail', () => {
  let folder: string
  let filePath: string

  beforeEach(async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), 'arena-log-tail-'))
    filePath = path.join(folder, 'arena.log')
  })

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true })
  })

  describe('readLastLines', () => {
    test('missing file', async () => {
      const result = await readLastLines({ filePath, maxLines: 10 })
      expect(result).toEqual({ exists: false, lines: [], offset: 0, ino: null, truncated: false })
    })

    test('file with less lines than maxLines', async () => {
      const text = toText(toLines(3))
      await writeFile(filePath, text)
      const result = await readLastLines({ filePath, maxLines: 10 })
      expect(result.lines).toEqual(toLines(3))
      expect(result.offset).toBe(Buffer.byteLength(text))
      expect(result.truncated).toBe(false)
    })

    test('large file: returns only the last maxLines lines', async () => {
      const lines = toLines(50000)
      await writeFile(filePath, toText(lines))
      const result = await readLastLines({ filePath, maxLines: 1000 })
      expect(result.lines).toEqual(lines.slice(-1000))
      expect(result.truncated).toBe(false)
    })

    test('partial last line is not returned and tailing continues before it', async () => {
      const text = toText(toLines(2))
      await writeFile(filePath, `${text}partial`)
      const result = await readLastLines({ filePath, maxLines: 10 })
      expect(result.lines).toEqual(toLines(2))
      expect(result.offset).toBe(Buffer.byteLength(text))
    })

    test('byte limit reached: incomplete first line skipped and result truncated', async () => {
      await writeFile(filePath, toText(toLines(1000)))
      const result = await readLastLines({ filePath, maxLines: 1000, maxBytes: 100 })
      expect(result.truncated).toBe(true)
      expect(result.lines.length).toBeGreaterThan(0)
      expect(result.lines.length).toBeLessThan(1000)
      expect(result.lines.at(-1)).toBe('line 1000')
      for (const line of result.lines) {
        expect(line).toMatch(/^line \d+$/)
      }
    })

    test('multi-byte characters', async () => {
      const lines = ['ñandú', '日本語のログ', 'ok']
      await writeFile(filePath, toText(lines))
      const result = await readLastLines({ filePath, maxLines: 2 })
      expect(result.lines).toEqual(lines.slice(-2))
    })
  })

  describe('LogFileTail', () => {
    test('notifies appended lines', async () => {
      await writeFile(filePath, toText(toLines(2)))
      const { tail, received, resets } = await createTail(filePath)
      await tail.poll()
      expect(received).toEqual([])

      await appendFile(filePath, toText(['new 1', 'new 2']))
      await tail.poll()
      expect(received).toEqual(['new 1', 'new 2'])
      expect(resets).toEqual([])
    })

    test('waits for partial lines to be completed', async () => {
      await writeFile(filePath, '')
      const { tail, received } = await createTail(filePath)
      await appendFile(filePath, 'first half')
      await tail.poll()
      expect(received).toEqual([])

      await appendFile(filePath, ' second half\nnext\n')
      await tail.poll()
      expect(received).toEqual(['first half second half', 'next'])
    })

    test('file rotated: reset and read the new file from the beginning', async () => {
      await writeFile(filePath, toText(toLines(5)))
      const { tail, received, resets } = await createTail(filePath)

      await rename(filePath, `${filePath}.1`)
      await tail.poll()
      expect(resets).toEqual([])

      await writeFile(filePath, toText(['after rotation']))
      await tail.poll()
      expect(resets).toEqual([SystemLogResetReasons.rotated])
      expect(received).toEqual(['after rotation'])
    })

    test('file truncated: reset', async () => {
      await writeFile(filePath, toText(toLines(5)))
      const { tail, received, resets } = await createTail(filePath)

      await writeFile(filePath, toText(['x']))
      await tail.poll()
      expect(resets).toEqual([SystemLogResetReasons.rotated])
      expect(received).toEqual(['x'])
    })

    test('file created after the tail started', async () => {
      const { tail, received } = await createTail(filePath)
      await tail.poll()
      await writeFile(filePath, toText(['created']))
      await tail.poll()
      expect(received).toEqual(['created'])
    })

    test('too many bytes appended: oldest skipped', async () => {
      await writeFile(filePath, '')
      const { tail, received, resets } = await createTail(filePath, { maxBytesPerRead: 100 })
      const lines = toLines(100)
      await appendFile(filePath, toText(lines))
      await tail.poll()
      expect(resets).toEqual([SystemLogResetReasons.skipped])
      expect(received.length).toBeGreaterThan(0)
      expect(received.at(-1)).toBe('line 100')
      expect(lines.slice(-received.length)).toEqual(received)
    })
  })
})
