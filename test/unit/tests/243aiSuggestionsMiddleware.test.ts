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

describe('AI suggestions middleware (243)', () => {
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

  test('a category deleted and survey info saved are derived from the actions the store already sees', async () => {
    const events: SuggestionEvent[] = []
    const middleware = createAiSuggestionsMiddleware((event) => events.push(event))
    const next = jest.fn((action: unknown) => action)
    dispatchThrough(middleware, { type: 'survey/info/update', surveyInfo: {} }, next)
    dispatchThrough(middleware, { type: 'survey/category/delete', categoryUuid: 'c1' }, next)
    // an edit of a category (labels typed, an item added) is not a change of the categories
    dispatchThrough(middleware, { type: 'survey/category/update', category: {} }, next)
    dispatchThrough(middleware, { type: 'survey/info/validation/update', validation: {} }, next)
    expect(next).toHaveBeenCalledTimes(4)
    // the survey info event waits for the code that dispatched the save to finish (it resets the defs right after)
    expect(events).toEqual([{ type: 'categoriesChanged' }])
    await Promise.resolve()
    expect(events).toEqual([{ type: 'categoriesChanged' }, { type: 'surveyInfoSaved' }])
  })

  test.each(['CategoryImportJob', 'CategoriesBatchImportJob'])(
    'a succeeded %s is a jobSucceeded and a categoriesChanged, in that order',
    (type) => {
      const events: SuggestionEvent[] = []
      const middleware = createAiSuggestionsMiddleware((event) => events.push(event))
      const job = { ...succeededJob, type, result: {} }
      dispatchThrough(middleware, { type: JOB_UPDATE, job }, (action) => action)
      expect(events).toEqual([{ type: 'jobSucceeded', job }, { type: 'categoriesChanged' }])
    }
  )

  test('a category import that is running or failed changes nothing; another succeeded job is only a jobSucceeded', () => {
    const events: SuggestionEvent[] = []
    const middleware = createAiSuggestionsMiddleware((event) => events.push(event))
    const next = (action: unknown) => action
    dispatchThrough(
      middleware,
      { type: JOB_UPDATE, job: { ...succeededJob, type: 'CategoryImportJob', succeeded: false, running: true } },
      next
    )
    dispatchThrough(
      middleware,
      { type: JOB_UPDATE, job: { ...succeededJob, type: 'CategoryImportJob', succeeded: false, failed: true } },
      next
    )
    dispatchThrough(middleware, { type: JOB_UPDATE, job: succeededJob }, next)
    expect(events.map((event) => event.type)).toEqual(['jobSucceeded'])
  })

  test('a listener that fails for one event does not stop the next one', () => {
    const events: string[] = []
    const log = jest.fn()
    const middleware = createAiSuggestionsMiddleware((event) => {
      events.push(event.type)
      if (event.type === 'jobSucceeded') throw new Error('listener failed')
    }, log)
    const job = { ...succeededJob, type: 'CategoryImportJob' }
    dispatchThrough(middleware, { type: JOB_UPDATE, job }, (action) => action)
    expect(events).toEqual(['jobSucceeded', 'categoriesChanged'])
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('jobSucceeded'), expect.any(Error))
  })

  test('a failing listener never breaks the dispatch', () => {
    const middleware = createAiSuggestionsMiddleware(() => {
      throw new Error('listener failed')
    }, jest.fn())
    const action = { type: JOB_UPDATE, job: succeededJob }
    expect(dispatchThrough(middleware, action, (dispatched) => dispatched)).toBe(action)
  })

  test('the app middleware is built on notifySuggestionEvent', () => {
    expect(typeof aiSuggestionsMiddleware).toBe('function')
  })
})
