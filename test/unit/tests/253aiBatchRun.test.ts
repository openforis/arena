// test/unit/tests/253aiBatchRun.test.ts
import SystemError from '@core/systemError'

import { isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import {
  type AiBatchCall,
  chunkArray,
  createAiBatchGuard,
  isRunStoppingError,
  runAiBatchCalls,
} from '@webapp/ai/workflows/batchRun'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const call = <T>(size: number, run: () => Promise<T>): AiBatchCall<T> => ({ size, run: async () => run() })
const noGuard = async () => {}
const settingsOn = { accessLevel: 2, featuresEnabled: true, featureToggles: { translation: true } }
const cloudPolicy = { schema: 'cloud', data: 'onDevice' } as const
const onDevicePolicy = { schema: 'onDevice', data: 'onDevice' } as const

/**
 * Creates the guard of a cloud engine for the translation of survey 7.
 * @param {object} deps - Guard dependencies.
 * @returns {Function} The guard.
 */
const cloudGuard = (deps: any) =>
  createAiBatchGuard({ feature: 'translation', surveyId: 7, dataClass: 'schema', hostingClass: 'cloud', deps })

describe('AI batch runner (253)', () => {
  test('runs the calls in order and reports the progress', async () => {
    const results: [string, number][] = []
    const progress: unknown[] = []
    const { failedCount } = await runAiBatchCalls({
      calls: [call(2, async () => 'a'), call(3, async () => 'b')],
      guard: noGuard,
      onResult: (result, index) => {
        results.push([result, index])
      },
      onProgress: (value) => progress.push(value),
    })
    expect(results).toEqual([
      ['a', 0],
      ['b', 1],
    ])
    expect(progress).toEqual([
      { done: 0, total: 2 },
      { done: 1, total: 2 },
      { done: 2, total: 2 },
    ])
    expect(failedCount).toBe(0)
  })

  test('a failed call is counted by its size and the run goes on', async () => {
    const results: string[] = []
    const { failedCount } = await runAiBatchCalls({
      calls: [
        call(4, async () => {
          throw new SystemError('aiTranslationInvalid', {}, 502)
        }),
        call(1, async () => 'ok'),
        call(2, async () => {
          throw new Error('fetch failed')
        }),
      ],
      guard: noGuard,
      onResult: (result) => {
        results.push(result)
      },
    })
    expect(results).toEqual(['ok'])
    expect(failedCount).toBe(6)
  })

  test('an error that fails every call stops the run at once', async () => {
    let ran = 0
    const failing = async () => {
      ran += 1
      throw new SystemError('aiProviderAuth', {}, 502)
    }
    await expectSystemErrorKey(
      runAiBatchCalls({ calls: [call(1, failing), call(1, failing)], guard: noGuard, onResult: () => {} }),
      'aiProviderAuth'
    )
    expect(ran).toBe(1)
  })

  test('a policy change during the run stops it before the next call', async () => {
    let policyReads = 0
    let ran = 0
    const guard = cloudGuard({
      fetchSettings: async () => settingsOn,
      fetchEffectivePolicy: async () => {
        policyReads += 1
        return policyReads === 1 ? cloudPolicy : onDevicePolicy
      },
    })
    const run = async () => {
      ran += 1
    }
    const error: any = await expectSystemErrorKey(
      runAiBatchCalls({ calls: [call(1, run), call(1, run)], guard, onResult: () => {} }),
      'aiPolicyRefused'
    )
    expect(error.statusCode).toBe(403)
    expect(ran).toBe(1)
  })

  test('cancel during a call rejects with an abort error and runs nothing more', async () => {
    const controller = new AbortController()
    let ran = 0
    const run = async () => {
      ran += 1
      controller.abort()
      // what the HTTP client throws when its request is aborted is not always an AbortError
      throw new Error('fetch failed')
    }
    const error = await runAiBatchCalls({
      calls: [call(1, run), call(1, run)],
      guard: noGuard,
      onResult: () => {},
      signal: controller.signal,
    }).catch((caught) => caught)
    expect(isAiAbortError(error)).toBe(true)
    expect(ran).toBe(1)
  })

  test('the guard re-reads the AI switches: a feature turned off stops the run', async () => {
    const guard = cloudGuard({
      fetchSettings: async () => ({ ...settingsOn, featureToggles: { translation: false } }),
      fetchEffectivePolicy: async () => cloudPolicy,
    })
    const error: any = await expectSystemErrorKey(guard(), 'aiFeatureDisabled')
    expect(error.statusCode).toBe(403)
    expect(error.params).toEqual({ feature: 'translation' })
  })

  test('the guard fails closed when the settings or the policy are unknown', async () => {
    await expectSystemErrorKey(
      cloudGuard({ fetchSettings: async () => null, fetchEffectivePolicy: async () => cloudPolicy })(),
      'aiFeatureDisabled'
    )
    await expectSystemErrorKey(
      cloudGuard({ fetchSettings: async () => settingsOn, fetchEffectivePolicy: async () => null })(),
      'aiPolicyRefused'
    )
  })

  test('the guard lets a hosting class within the policy through', async () => {
    const surveyIds: number[] = []
    const guard = cloudGuard({
      fetchSettings: async () => settingsOn,
      fetchEffectivePolicy: async (surveyId: number) => {
        surveyIds.push(surveyId)
        return cloudPolicy
      },
    })
    await expect(guard()).resolves.toBeUndefined()
    expect(surveyIds).toEqual([7])
  })

  test('run-stopping errors', () => {
    for (const key of ['aiPolicyRefused', 'aiFeatureDisabled', 'aiProviderAuth', 'aiLocalServerUnreachable']) {
      expect([key, isRunStoppingError(new SystemError(key, {}, 500))]).toEqual([key, true])
    }
    for (const key of ['aiTranslationInvalid', 'aiDataDictionaryInvalid', 'aiRequestTimeout', 'aiPromptTooLarge']) {
      expect([key, isRunStoppingError(new SystemError(key, {}, 500))]).toEqual([key, false])
    }
    expect(isRunStoppingError(new Error('x'))).toBe(false)
  })

  test('chunkArray', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunkArray([], 3)).toEqual([])
  })
})
