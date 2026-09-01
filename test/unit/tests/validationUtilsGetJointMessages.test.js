import * as Validation from '@core/validation/validation'
import { ValidationUtils } from '@core/validation/validationUtils'

const i18n = {
  language: 'en',
  t: (key, params) => params?.text ?? key,
  exists: () => true,
}

describe('ValidationUtils.getJointMessages', () => {
  test('renders the message from a well-formed fields-map (error field, per Job.addError convention)', () => {
    const validation = Validation.newInstance(false, {
      error: Validation.newInstance(false, {}, [{ key: 'appErrors:generic', params: { text: 'boom' } }]),
    })

    const messages = ValidationUtils.getJointMessages({ i18n, survey: {}, showKeys: false })(validation)

    expect(messages).toEqual([{ severity: expect.anything(), text: 'boom' }])
  })

  test('normalizes a bare ValidationResult stored directly as the fields-map, instead of rendering "key"/"params" as invalid fields', () => {
    // Shape a job error row can end up with when persisted without going through Job.addError's
    // { error: { valid, errors: [...] } } wrapping (see failOrphanedByInstanceId / staleJobsCleanup).
    const validation = Validation.newInstance(false, { key: 'appErrors:generic', params: { text: 'boom' } })

    const messages = ValidationUtils.getJointMessages({ i18n, survey: {}, showKeys: false })(validation)

    expect(messages).toEqual([{ severity: expect.anything(), text: 'boom' }])
    expect(messages.some(({ text }) => text.includes('key') || text.includes('params'))).toBe(false)
  })
})
