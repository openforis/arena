import * as Survey from '@core/survey/survey'
import { insertSurvey } from '@server/modules/survey/repository/surveyRepository'

const newTestSurvey = () =>
  Survey.newSurvey({
    ownerUuid: 'owner-uuid-1',
    name: 'test_survey',
    languages: ['en'],
  })

/**
 * Creates a fake pg-promise-like client that just records the query and params passed to `.one`,
 * without touching a real database (there is no DB available in the unit test environment).
 * @returns {object} - The fake client, with a `calls` array exposing every recorded `.one` invocation.
 */
const newFakeClient = () => {
  const calls = []
  return {
    calls,
    one: async (query, params) => {
      calls.push({ query, params })
      return {}
    },
  }
}

describe('surveyRepository.insertSurvey', () => {
  it('includes app_version among the inserted columns', async () => {
    const client = newFakeClient()
    await insertSurvey({ survey: newTestSurvey(), appVersion: '2.7.2' }, client)

    expect(client.calls).toHaveLength(1)
    const { query } = client.calls[0]
    expect(query).toEqual(expect.stringContaining('app_version'))
  })

  it('passes the given appVersion as one of the insert parameters (a newly created survey is stamped as fully migrated, not left NULL/pending)', async () => {
    const client = newFakeClient()
    await insertSurvey({ survey: newTestSurvey(), appVersion: '2.7.2' }, client)

    const { params } = client.calls[0]
    expect(params).toEqual(expect.arrayContaining(['2.7.2']))
  })
})
