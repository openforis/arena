import * as Survey from '@core/survey/survey'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'

// pg-promise-like client recording the calls (no database in the unit tests)
const newFakeClient = (result: unknown = null) => {
  const calls: { method: string; query: string; params: unknown }[] = []
  const record = (method: string) => async (query: string, params: unknown, transform?: (row: unknown) => unknown) => {
    calls.push({ method, query, params })
    return transform ? transform(result) : result
  }
  return { calls, none: record('none'), oneOrNone: record('oneOrNone') }
}

describe('survey config keys', () => {
  test('include aiPolicy', () => {
    expect(Survey.configKeys.aiPolicy).toBe('aiPolicy')
    expect(Survey.configKeys.filesTotalSpace).toBe('filesTotalSpace')
  })
})

describe('fetchSurveyAiPolicy', () => {
  test('selects only config.aiPolicy of the survey', async () => {
    const client = newFakeClient({ value: { schema: 'off', data: 'cloud' } })
    const value = await SurveyRepository.fetchSurveyAiPolicy(12, client)
    expect(value).toEqual({ schema: 'off', data: 'cloud' })
    expect(client.calls).toHaveLength(1)
    expect(client.calls[0].query).toContain(`config#>'{aiPolicy}'`)
    expect(client.calls[0].params).toEqual([12])
  })

  test('returns null when the survey has no policy', async () => {
    const client = newFakeClient({ value: null })
    expect(await SurveyRepository.fetchSurveyAiPolicy(12, client)).toBeNull()
  })
})

describe('clearSurveyConfigurationProp', () => {
  test('clearing a config key keeps the other keys', async () => {
    const client = newFakeClient()
    await SurveyRepository.clearSurveyConfigurationProp({ surveyId: 5, key: 'filesTotalSpace' }, client)
    const { query, params } = client.calls[0]
    expect(query).not.toMatch(/config\s*=\s*null/i)
    expect(query).toContain(`config - $/key/`)
    expect(params).toEqual({ surveyId: 5, key: 'filesTotalSpace' })
  })

  test('the old whole-config reset is gone', () => {
    expect((SurveyRepository as any).clearSurveyConfiguration).toBeUndefined()
  })
})
