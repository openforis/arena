import { RecordEvaluationContext } from '@core/record/recordEvaluationContext'

import {
  createRecordEvaluationContext,
  RecordProvidersDefault,
} from '@server/modules/record/manager/recordEvaluationContextDefault'

describe('RecordEvaluationContext', () => {
  it('extract keeps only the expression evaluation params', () => {
    const categoryItemProvider = {}
    const context = RecordEvaluationContext.extract({
      user: { uuid: 'u1' },
      survey: { id: 1 },
      categoryItemProvider,
      timezoneOffset: null,
      record: {},
      sideEffect: true,
      entity: {},
    })
    expect(context).toEqual({ user: { uuid: 'u1' }, survey: { id: 1 }, categoryItemProvider })
  })

  it('server context includes all the default providers', () => {
    const context = createRecordEvaluationContext({ user: { uuid: 'u1' }, survey: { id: 1 }, lang: 'en' })
    expect(context).toEqual({ user: { uuid: 'u1' }, survey: { id: 1 }, lang: 'en', ...RecordProvidersDefault })
    const missingKeys = RecordEvaluationContext.keys.filter((key) => key !== 'timezoneOffset' && !context[key])
    expect(missingKeys).toEqual([])
  })
})
