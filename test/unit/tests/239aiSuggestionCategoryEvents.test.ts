import { configureStore, type Middleware } from '@reduxjs/toolkit'
import axios from 'axios'

import { createAiSuggestionsMiddleware } from '@webapp/ai/suggestions/aiSuggestionsMiddleware'
import { surveyDefsReset } from '@webapp/store/survey/actions/actionTypes'
import { updateSurveyInfoProps } from '@webapp/store/survey/surveyInfo/actions'

describe('category labels suggestion events (239)', () => {
  // the invalid save raises a notification whose auto-hide timer (10 s) would keep the jest worker alive
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate'] })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('a valid survey info save sends surveyInfoSaved after the defs reset; an invalid one sends nothing', async () => {
    let order: string[] = []
    const recorder: Middleware = () => (next) => (action: any) => {
      if (action?.type) order.push(action.type)
      return next(action)
    }
    // the real middleware on a store with the survey id the action creator reads
    const store = configureStore({
      reducer: (state: object = { survey: { id: 7 } }) => state,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
          recorder,
          createAiSuggestionsMiddleware((event) => order.push(`event:${event.type}`))
        ),
    })
    const put = jest
      .spyOn(axios, 'put')
      .mockResolvedValueOnce({ data: { info: { id: 7, props: {}, validation: { valid: true, fields: {} } } } })
      .mockResolvedValueOnce({
        data: {
          info: { id: 7, props: {}, validation: { valid: false, fields: { name: { valid: false, errors: [] } } } },
        },
      })

    await store.dispatch(updateSurveyInfoProps({ languages: ['en', 'fr'] }) as any)
    // the event is sent once the dispatches of the save are done
    await Promise.resolve()
    expect(put).toHaveBeenCalledWith('/api/survey/7/info', { languages: ['en', 'fr'] })
    expect(order.filter((item) => item === surveyDefsReset || item.startsWith('event:'))).toEqual([
      surveyDefsReset,
      'event:surveyInfoSaved',
    ])

    order = []
    await store.dispatch(updateSurveyInfoProps({ name: '' }) as any)
    await Promise.resolve()
    expect(order.filter((item) => item.startsWith('event:'))).toEqual([])
  })
})
