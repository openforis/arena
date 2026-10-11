import type { Middleware } from 'redux'

import { aiSuggestionsMiddleware, createAiSuggestionsMiddleware } from '@webapp/ai/suggestions/aiSuggestionsMiddleware'
import type { SuggestionEvent } from '@webapp/ai/suggestions/detectors'
import { JOB_UPDATE } from '@webapp/store/app/job/actions'

const succeededJob = {
  uuid: 'job-1',
  type: 'DataImportJob',
  userUuid: 'u1',
  surveyId: 7,
  succeeded: true,
  ended: true,
  result: { insertedRecords: 2 },
}

/**
 * Dispatches an action through a middleware.
 * @param {Middleware} middleware - The middleware.
 * @param {unknown} action - The action.
 * @param {Function} next - The next dispatch.
 * @returns {unknown} What the middleware returned.
 */
const dispatchThrough = (middleware: Middleware, action: unknown, next: (action: unknown) => unknown) =>
  middleware({ getState: () => ({}), dispatch: jest.fn() } as any)(next)(action)

describe('AI suggestions job middleware (243)', () => {
  test('a succeeded job update is reported after the reducers ran', () => {
    const calls: string[] = []
    const events: SuggestionEvent[] = []
    const middleware = createAiSuggestionsMiddleware((event) => {
      calls.push('notify')
      events.push(event)
    })
    const action = { type: JOB_UPDATE, job: succeededJob }
    const result = dispatchThrough(middleware, action, (dispatched) => {
      calls.push('next')
      return { dispatched }
    })
    expect(result).toEqual({ dispatched: action })
    expect(calls).toEqual(['next', 'notify'])
    expect(events).toEqual([{ type: 'jobSucceeded', job: succeededJob }])
  })

  test('other actions, running or failed jobs and the monitor reset are not reported', () => {
    const notify = jest.fn()
    const middleware = createAiSuggestionsMiddleware(notify)
    const next = jest.fn((action: unknown) => action)
    dispatchThrough(middleware, { type: 'survey/defs/load' }, next)
    dispatchThrough(middleware, { type: JOB_UPDATE, job: { ...succeededJob, succeeded: false, running: true } }, next)
    dispatchThrough(middleware, { type: JOB_UPDATE, job: { ...succeededJob, succeeded: false, failed: true } }, next)
    dispatchThrough(middleware, { type: JOB_UPDATE, job: null }, next)
    dispatchThrough(middleware, null, next)
    expect(next).toHaveBeenCalledTimes(5)
    expect(notify).not.toHaveBeenCalled()
  })

  test('a failing listener never breaks the dispatch', () => {
    const middleware = createAiSuggestionsMiddleware(() => {
      throw new Error('listener failed')
    })
    const action = { type: JOB_UPDATE, job: succeededJob }
    expect(dispatchThrough(middleware, action, (dispatched) => dispatched)).toBe(action)
  })

  test('the app middleware is built on notifySuggestionEvent', () => {
    expect(typeof aiSuggestionsMiddleware).toBe('function')
  })
})
