import { assertFeatureEnabled } from '@server/modules/ai/service/featureGate'

const userWith = (ai): any => ({ uuid: 'u1', prefs: { ai } })
const allToggles = {
  chat: true,
  expressions: true,
  translation: true,
  dataDictionary: true,
  userActivity: true,
  dataQuery: true,
}
const userAllOn = userWith({ featuresEnabled: true, featureToggles: allToggles })
const envOn = { aiFeaturesEnabled: true, aiFeatureFlags: null }

const expectSystemError = (fn: () => void, key: string, statusCode: number) => {
  let thrown = null
  try {
    fn()
  } catch (error) {
    thrown = error
  }
  expect(thrown?.key).toBe(key)
  expect(thrown?.statusCode).toBe(statusCode)
}

describe('assertFeatureEnabled', () => {
  test('passes when env, flags, master switch and category are on', () => {
    expect(() => assertFeatureEnabled('expressionGenerate', userAllOn, envOn)).not.toThrow()
  })

  test('env master switch off → aiFeaturesDisabled 404 (checked first)', () => {
    expectSystemError(
      () => assertFeatureEnabled('expressionGenerate', userWith(null), { ...envOn, aiFeaturesEnabled: false }),
      'aiFeaturesDisabled',
      404
    )
  })

  test('env flag false → aiFeatureDisabled 403', () => {
    const env = { ...envOn, aiFeatureFlags: { expressionGenerate: false } }
    expectSystemError(() => assertFeatureEnabled('expressionGenerate', userAllOn, env), 'aiFeatureDisabled', 403)
  })

  test('env flag true cannot override a disabled master switch', () => {
    const env = { aiFeaturesEnabled: false, aiFeatureFlags: { expressionGenerate: true } }
    expectSystemError(() => assertFeatureEnabled('expressionGenerate', userAllOn, env), 'aiFeaturesDisabled', 404)
  })

  test('user master switch off → aiFeaturesDisabled 403', () => {
    const user = userWith({ featuresEnabled: false, featureToggles: allToggles })
    expectSystemError(() => assertFeatureEnabled('translation', user, envOn), 'aiFeaturesDisabled', 403)
  })

  test('user category off → aiFeatureDisabled 403', () => {
    const user = userWith({ featuresEnabled: true, featureToggles: { ...allToggles, dataQuery: false } })
    expectSystemError(() => assertFeatureEnabled('dataQueryGenerate', user, envOn), 'aiFeatureDisabled', 403)
  })

  test('the data dictionary job is gated by the dataDictionary flag and category', () => {
    const env = { ...envOn, aiFeatureFlags: { dataDictionary: false } }
    expectSystemError(() => assertFeatureEnabled('dataDictionary', userAllOn, env), 'aiFeatureDisabled', 403)
    const user = userWith({ featuresEnabled: true, featureToggles: { ...allToggles, dataDictionary: false } })
    expectSystemError(() => assertFeatureEnabled('dataDictionary', user, envOn), 'aiFeatureDisabled', 403)
  })

  test('features without a category only need the master switches', () => {
    const user = userWith({ featuresEnabled: true, featureToggles: {} })
    expect(() => assertFeatureEnabled('internalPing', user, envOn)).not.toThrow()
  })
})
