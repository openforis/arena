import axios from 'axios'

import { subscribeSuggestionEvents } from '@webapp/ai/suggestions/suggestionEvents'
import { surveyDefsReset } from '@webapp/store/survey/actions/actionTypes'
import { updateSurveyInfoProps } from '@webapp/store/survey/surveyInfo/actions'

describe('category labels suggestion events (239)', () => {
  let order: string[] = []
  let unsubscribe: () => void = () => undefined

  beforeEach(() => {
    order = []
    unsubscribe = subscribeSuggestionEvents((event) => order.push(`event:${event.type}`))
  })

  afterEach(() => {
    unsubscribe()
    jest.restoreAllMocks()
  })

  test('a valid survey info save sends surveyInfoSaved after the defs reset; an invalid one sends nothing', async () => {
    const dispatch = jest.fn((action: any) => {
      if (action?.type) order.push(action.type)
      return action
    })
    const getState = () => ({ survey: { id: 7 } })
    const put = jest
      .spyOn(axios, 'put')
      .mockResolvedValueOnce({ data: { info: { id: 7, props: {}, validation: { valid: true, fields: {} } } } })
      .mockResolvedValueOnce({
        data: {
          info: { id: 7, props: {}, validation: { valid: false, fields: { name: { valid: false, errors: [] } } } },
        },
      })

    await updateSurveyInfoProps({ languages: ['en', 'fr'] })(dispatch, getState)
    expect(put).toHaveBeenCalledWith('/api/survey/7/info', { languages: ['en', 'fr'] })
    expect(order.filter((item) => item === surveyDefsReset || item.startsWith('event:'))).toEqual([
      surveyDefsReset,
      'event:surveyInfoSaved',
    ])

    order = []
    await updateSurveyInfoProps({ name: '' })(dispatch, getState)
    expect(order.filter((item) => item.startsWith('event:'))).toEqual([])
  })
})
