import SystemError from '@core/systemError'
import { AiLimits } from '@common/ai/limits'

import { isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { type AiBatchCall, createAbortError, runAiBatchCalls } from '@webapp/ai/workflows/batchRun'
import { createBatchRunControl, settleBatchRun } from '@webapp/ai/workflows/batchRunControl'
import { runDataDictionaryDescriptions } from '@webapp/ai/workflows/dataDictionary'
import { runTranslateAllLabels } from '@webapp/ai/workflows/translateAllLabels'

import * as SB from '../../utils/surveyBuilder'
import { LANGUAGES, namespaceByLanguage } from '../utils/i18nParity'

const commonByLang = namespaceByLanguage('common')
const en = commonByLang.en

const noGuard = async () => {}
const generateText = async () => ''
const authError = () => new SystemError('aiProviderAuth', {}, 502)
const call = <T>(size: number, run: () => Promise<T>): AiBatchCall<T> => ({ size, run: async () => run() })

describe('AI batch partial results (441)', () => {
  describe('runAiBatchCalls', () => {
    test('an error that fails every call keeps the results so far, counts the calls not run and says where it stopped', async () => {
      const results: string[] = []
      const error = authError()
      const { failedCount, stop } = await runAiBatchCalls({
        calls: [
          call(2, async () => 'a'),
          call(3, async () => 'b'),
          call(4, async () => {
            throw error
          }),
          call(5, async () => 'd'),
        ],
        guard: noGuard,
        onResult: (result) => {
          results.push(result)
        },
      })
      expect(results).toEqual(['a', 'b'])
      // the failed call (4) and the one after it (5) produced nothing
      expect(failedCount).toBe(9)
      expect(stop).toEqual({ cause: 'error', error, done: 2, total: 4 })
    })

    test('a guard that rejects (a blip, a policy change) keeps the results so far', async () => {
      const results: number[] = []
      let guards = 0
      const guard = async () => {
        guards += 1
        if (guards === 3) throw new Error('network down')
      }
      const { failedCount, stop } = await runAiBatchCalls({
        calls: [1, 2, 3, 4].map((n) => call(n, async () => n)),
        guard,
        onResult: (result) => {
          results.push(result)
        },
      })
      expect(results).toEqual([1, 2])
      expect(failedCount).toBe(7)
      expect(stop).toMatchObject({ cause: 'error', done: 2, total: 4 })
    })

    test('a cancel after some results keeps them', async () => {
      const controller = new AbortController()
      const results: number[] = []
      const { failedCount, stop } = await runAiBatchCalls({
        calls: [
          call(1, async () => 1),
          call(1, async () => {
            controller.abort()
            throw new Error('fetch failed')
          }),
          call(1, async () => 3),
        ],
        guard: noGuard,
        onResult: (result) => {
          results.push(result)
        },
        signal: controller.signal,
      })
      expect(results).toEqual([1])
      expect(failedCount).toBe(2)
      expect(stop).toEqual({ cause: 'cancelled', done: 1, total: 3 })
    })

    test('a stop does not wait for a guard that hangs', async () => {
      const controller = new AbortController()
      const results: number[] = []
      let guards = 0
      // the second guard never answers
      const guard = () => {
        guards += 1
        return guards === 2 ? new Promise<void>(() => {}) : Promise.resolve()
      }
      const run = runAiBatchCalls({
        calls: [call(1, async () => 1), call(1, async () => 2)],
        guard,
        onResult: (result) => {
          results.push(result)
        },
        signal: controller.signal,
      })
      // let the first call finish and the second guard start
      await new Promise((resolve) => {
        setTimeout(resolve, 20)
      })
      controller.abort()
      const { failedCount, stop } = await run
      expect(results).toEqual([1])
      expect(failedCount).toBe(1)
      expect(stop).toEqual({ cause: 'cancelled', done: 1, total: 2 })
    })

    test('nothing to keep: the first error is thrown, a cancel is an abort error', async () => {
      const error = authError()
      await expect(
        runAiBatchCalls({
          calls: [
            call(1, async () => {
              throw error
            }),
          ],
          guard: noGuard,
          onResult: () => {},
        })
      ).rejects.toBe(error)
      const controller = new AbortController()
      controller.abort()
      const aborted = await runAiBatchCalls({
        calls: [call(1, async () => 1)],
        guard: noGuard,
        onResult: () => {},
        signal: controller.signal,
      }).catch((caught) => caught)
      expect(isAiAbortError(aborted)).toBe(true)
    })

    test('calls that fail one by one before the stop are not results: nothing to keep', async () => {
      const soft = () => new SystemError('aiTranslationInvalid', {}, 502)
      const error = authError()
      await expect(
        runAiBatchCalls({
          calls: [
            call(1, async () => {
              throw soft()
            }),
            call(1, async () => {
              throw error
            }),
          ],
          guard: noGuard,
          onResult: () => {},
        })
      ).rejects.toBe(error)
    })

    test('a run that ends normally has no stop', async () => {
      const { stop } = await runAiBatchCalls({ calls: [call(1, async () => 1)], guard: noGuard, onResult: () => {} })
      expect(stop).toBeNull()
    })
  })

  describe('translate all labels', () => {
    test('a stop after some batches keeps their translations and counts the rest as not produced', async () => {
      const survey = await SB.survey(
        { uuid: 'test-ai-batch-partial-user' },
        SB.entity('root', ...Array.from({ length: 45 }, (_v, i) => SB.attribute(`a_${i}`).label(`Attribute ${i}`)))
      )
        .languages('en', 'fr')
        .build()
      let calls = 0
      const result = await runTranslateAllLabels({
        survey,
        generateText,
        guard: noGuard,
        // 45 texts in batches of 20: 20 + 20 + 5
        translate: async ({ items }: any) => {
          calls += 1
          if (calls === 3) throw authError()
          return { translations: items.map((item: any) => ({ id: item.id, byLang: { fr: `fr:${item.text}` } })) }
        },
      })
      expect(calls).toBe(3)
      expect(result.stop).toMatchObject({ cause: 'error', done: 2, total: 3 })
      const translated = result.items.filter((item) => Object.keys(item.aiLabelsByLang).length > 0)
      expect(translated).toHaveLength(40)
      // the last batch (5 texts x 1 language) was not translated
      expect(result.failedCount).toBe(5)
    })

    test('a run that ends normally has no stop', async () => {
      const survey = await SB.survey({ uuid: 'test-ai-batch-partial-user' }, SB.entity('root').label('Root'))
        .languages('en', 'fr')
        .build()
      const result = await runTranslateAllLabels({
        survey,
        generateText,
        guard: noGuard,
        translate: async ({ items }: any) => ({
          translations: items.map((item: any) => ({ id: item.id, byLang: { fr: 'x' } })),
        }),
      })
      expect(result.stop).toBeUndefined()
    })
  })

  describe('data dictionary', () => {
    test('a stop after some batches keeps their descriptions and counts the rest as left empty', async () => {
      const nodeDefs = Array.from({ length: 25 }, (_v, i) => ({
        uuid: `u${i}`,
        name: `n${i}`,
        type: 'decimal',
        parentPath: 'plot',
      }))
      let calls = 0
      const { aiDescriptions, failedCount, stop } = await runDataDictionaryDescriptions({
        items: { surveyName: 'forest', nodeDefs },
        generateText,
        guard: noGuard,
        describe: async ({ nodeDefs: batch }: any) => {
          calls += 1
          if (calls === 2) throw authError()
          return { descriptions: batch.map(({ uuid }: any) => ({ uuid, description: 'D' })) }
        },
      })
      expect(Object.keys(aiDescriptions)).toHaveLength(AiLimits.dataDictionaryBatchSize)
      expect(failedCount).toBe(25 - AiLimits.dataDictionaryBatchSize)
      expect(stop).toMatchObject({ cause: 'error', done: 1, total: 3 })
    })
  })

  describe('run control and outcome', () => {
    const noStop = () => null
    const stopped = { cause: 'cancelled' as const, done: 1, total: 3 }

    test('a stop request aborts the workflow but keeps the run; abandoning it discards the run', () => {
      const control = createBatchRunControl()
      expect(control.signal.aborted).toBe(false)
      control.requestStop()
      expect(control.signal.aborted).toBe(true)
      // the step that exports the partial results is not cancelled by a Stop
      expect(control.abandonSignal.aborted).toBe(false)
      expect(control.isStopRequested()).toBe(true)
      expect(control.isAbandoned()).toBe(false)
      control.abandon()
      expect(control.abandonSignal.aborted).toBe(true)
      expect(control.isAbandoned()).toBe(true)
      expect(control.isStopRequested()).toBe(false)
    })

    test('a result is done, with the stop the workflow reports', () => {
      const control = createBatchRunControl()
      expect(settleBatchRun({ settled: { result: 7 }, control, getStop: noStop })).toEqual({
        kind: 'done',
        result: 7,
        stop: null,
      })
      control.requestStop()
      expect(settleBatchRun({ settled: { result: 7 }, control, getStop: () => stopped })).toEqual({
        kind: 'done',
        result: 7,
        stop: stopped,
      })
    })

    test('an abandoned run is discarded, result or error', () => {
      const control = createBatchRunControl()
      control.abandon()
      expect(settleBatchRun({ settled: { result: 7 }, control, getStop: noStop })).toEqual({ kind: 'discarded' })
      expect(settleBatchRun({ settled: { error: authError() }, control, getStop: noStop })).toEqual({
        kind: 'discarded',
      })
    })

    test('a cancel with nothing to keep closes; another error is reported', () => {
      const control = createBatchRunControl()
      control.requestStop()
      expect(settleBatchRun({ settled: { error: createAbortError() }, control, getStop: noStop })).toEqual({
        kind: 'closed',
      })
      const error = authError()
      expect(settleBatchRun({ settled: { error }, control, getStop: noStop })).toEqual({ kind: 'failed', error })
    })
  })

  describe('texts', () => {
    const placeholders = (text: string): string[] => (text.match(/\{\{\w+\}\}/g) ?? []).sort()

    test.each(LANGUAGES)('%s tells that the run stopped and what is kept', (lang) => {
      const texts = commonByLang[lang].aiBatch
      for (const key of ['stop', 'stopping', 'confirmStop', 'keepRunning', 'stoppedCancelled', 'stoppedError']) {
        expect([key, typeof texts[key]]).toEqual([key, 'string'])
      }
      expect(placeholders(texts.stoppedCancelled)).toEqual(placeholders(en.aiBatch.stoppedCancelled))
      expect(placeholders(texts.stoppedError)).toEqual(['{{done}}', '{{message}}', '{{total}}'])
    })
  })
})
