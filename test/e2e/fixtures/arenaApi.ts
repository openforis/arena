import { APIRequestContext, expect, request } from '@playwright/test'

import type { TestUser } from './testUsers'
import { AiFeatureCategory } from '@common/ai/features'

type JobSummary = {
  uuid: string
  status: string
  ended: boolean
  succeeded: boolean
  errors?: unknown
  result?: Record<string, any>
}

export type SurveyCreateParams = {
  name: string
  label: string
  lang?: string
  template?: boolean
}

const jobPollIntervalMs = 250
const jobTimeoutMs = 30_000
const jobThreadCleanupWaitMs = 1500

/**
 * Returns every AI category switched on (one per AiFeatureCategory, so new categories are included).
 * @returns {Record<string, boolean>} The switches.
 */
const allAiFeatureToggles = (): Record<string, boolean> =>
  Object.fromEntries(Object.values(AiFeatureCategory).map((category) => [category, true]))

/**
 * Thin client of the Arena REST API, used to prepare (and clean up) the data needed by a test
 * without going through the UI.
 */
export class ArenaApi {
  private constructor(
    private readonly requestContext: APIRequestContext,
    private readonly authToken: string
  ) {}

  /**
   * Logs in the specified user and returns an API client authenticated as that user.
   * @param {object} params - Parameters.
   * @param {string} params.baseURL - Arena base URL.
   * @param {TestUser} params.user - User to log in.
   * @returns {Promise<ArenaApi>} - The authenticated API client.
   */
  static async login({ baseURL, user }: { baseURL: string; user: TestUser }): Promise<ArenaApi> {
    const requestContext = await request.newContext({ baseURL })
    const response = await requestContext.post('/auth/login', {
      data: { email: user.email, password: user.password },
    })
    expect(response.ok(), `login of ${user.email} failed: ${response.status()}`).toBeTruthy()
    const { authToken } = await response.json()
    return new ArenaApi(requestContext, authToken)
  }

  async dispose(): Promise<void> {
    await this.requestContext.dispose()
  }

  private get headers() {
    return { Authorization: `Bearer ${this.authToken}` }
  }

  private async get(url: string) {
    const response = await this.requestContext.get(url, { headers: this.headers })
    expect(response.ok(), `GET ${url} failed: ${response.status()}`).toBeTruthy()
    return response.json()
  }

  private async post(url: string, data: unknown) {
    const response = await this.requestContext.post(url, { headers: this.headers, data })
    expect(response.ok(), `POST ${url} failed: ${response.status()}`).toBeTruthy()
    return response.json()
  }

  private async put(url: string, data: unknown) {
    const response = await this.requestContext.put(url, { headers: this.headers, data })
    expect(response.ok(), `PUT ${url} failed: ${response.status()}`).toBeTruthy()
    return response.json()
  }

  /**
   * Turns on the AI features (all categories) for the test user, using the server default provider.
   * @returns {Promise<void>} - Resolves when saved.
   */
  async enableAiFeatures(): Promise<void> {
    await this.put('/api/ai/settings', { featuresEnabled: true, featureToggles: allAiFeatureToggles(), enabled: false })
  }

  /**
   * Turns off the AI features for the test user.
   * @returns {Promise<void>} - Resolves when saved.
   */
  async disableAiFeatures(): Promise<void> {
    await this.put('/api/ai/settings', { featuresEnabled: false, enabled: false })
  }

  /**
   * Returns the uuid of the logged-in test user (the key of C's localStorage settings).
   * @returns {Promise<string>} - The user uuid.
   */
  async getCurrentUserUuid(): Promise<string> {
    const { user } = await this.get('/auth/user')
    return user.uuid
  }

  async waitForJob(jobUuid: string): Promise<JobSummary> {
    const start = Date.now()
    for (;;) {
      const job: JobSummary = await this.get(`/api/jobs/${jobUuid}`)
      expect(job.uuid).toBe(jobUuid)
      if (job.ended) {
        expect(job.succeeded, `job ${jobUuid} did not succeed: ${JSON.stringify(job.errors)}`).toBe(true)
        return job
      }
      if (Date.now() - start > jobTimeoutMs) throw new Error(`job ${jobUuid} did not end in ${jobTimeoutMs}ms`)
      await new Promise((resolve) => setTimeout(resolve, jobPollIntervalMs))
    }
  }

  /**
   * Creates a new survey (and sets it as current survey of the user).
   * @param {SurveyCreateParams} params - Survey info.
   * @returns {Promise<number>} - The id of the survey created.
   */
  async createSurvey({ name, label, lang = 'en', template = false }: SurveyCreateParams): Promise<number> {
    const { job, validation } = await this.post('/api/survey', { name, label, lang, template })
    expect(validation, `survey validation failed: ${JSON.stringify(validation)}`).toBeUndefined()
    const jobEnded = await this.waitForJob(job.uuid)
    return Number(jobEnded.result!.surveyId)
  }

  /**
   * Clones a survey (job) and returns the id of the clone.
   * @param {object} params - Parameters.
   * @param {number} params.cloneFrom - Id of the survey to clone.
   * @param {string} [params.cloneFromCycle] - Cycle of the survey to clone.
   * @param {string} params.name - Name of the clone.
   * @param {string} params.label - Label of the clone.
   * @param {string} [params.lang] - Language.
   * @returns {Promise<number>} - The id of the clone.
   */
  async cloneSurvey({
    cloneFrom,
    cloneFromCycle = '0',
    name,
    label,
    lang = 'en',
  }: {
    cloneFrom: number
    cloneFromCycle?: string
    name: string
    label: string
    lang?: string
  }): Promise<number> {
    // the server ends the user's job thread 1 s after a job ends: a job started in that window would be killed
    await new Promise((resolve) => setTimeout(resolve, jobThreadCleanupWaitMs))
    const { job, validation } = await this.post('/api/survey', { name, label, lang, cloneFrom, cloneFromCycle })
    expect(validation, `survey clone validation failed: ${JSON.stringify(validation)}`).toBeUndefined()
    const jobEnded = await this.waitForJob(job.uuid)
    return Number(jobEnded.result!.surveyId)
  }

  /**
   * Returns the AI policy of a survey.
   * @param {number} surveyId - Survey id.
   * @returns {Promise<any>} - `{ policy, ceilings, effective, canEdit }`.
   */
  async getSurveyAiPolicy(surveyId: number): Promise<any> {
    return this.get(`/api/survey/${surveyId}/ai-policy`)
  }

  /**
   * Sets the AI policy of a survey (the test user is a system administrator).
   * @param {number} surveyId - Survey id.
   * @param {{schema: string, data: string}} policy - Policy.
   * @returns {Promise<any>} - `{ policy, ceilings, effective, canEdit }`.
   */
  async putSurveyAiPolicy(surveyId: number, policy: { schema: string; data: string }): Promise<any> {
    return this.put(`/api/survey/${surveyId}/ai-policy`, policy)
  }

  /**
   * Finds the id of the survey (or template) with the specified name.
   * @param {object} params - Parameters.
   * @param {string} params.name - Survey name.
   * @param {boolean} [params.template] - Whether to look for a template.
   * @returns {Promise<number | null>} - The survey id, or null if not found.
   */
  async findSurveyIdByName({ name, template = false }: { name: string; template?: boolean }): Promise<number | null> {
    const params = new URLSearchParams({ search: name, template: String(template) })
    const { list } = await this.get(`/api/surveys?${params}`)
    const surveyInfo = list.find((item: any) => (item.props?.name ?? item.propsDraft?.name) === name)
    return surveyInfo?.id ?? null
  }

  /**
   * Deletes the survey (or template) with the specified name, if it exists.
   * @param {object} params - Parameters.
   * @param {string} params.name - Survey name.
   * @param {boolean} [params.template] - Whether the survey is a template.
   * @returns {Promise<void>} - Resolves when the survey has been deleted.
   */
  async deleteSurveyByNameIfExists({ name, template = false }: { name: string; template?: boolean }): Promise<void> {
    const surveyId = await this.findSurveyIdByName({ name, template })
    if (surveyId) await this.deleteSurveyIfExists(surveyId)
  }

  /**
   * Deletes the survey with the specified id; it does nothing if the survey does not exist anymore.
   * @param {number} surveyId - Id of the survey to delete.
   * @returns {Promise<void>} - Resolves when the survey has been deleted.
   */
  async deleteSurveyIfExists(surveyId: number): Promise<void> {
    await this.requestContext.delete(`/api/survey/${surveyId}`, { headers: this.headers })
  }
}
