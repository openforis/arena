import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'

import type { AnalysisApi } from '@webapp/ai/tools/analysis/analysisApi'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'

import { fakeT } from './assistantTestUtils'

export const adminUser = { uuid: 'admin-user', authGroups: [{ name: 'systemAdmin' }] }
export const userWithoutAccess = { uuid: 'no-access-user', authGroups: [] }

/**
 * Returns a user belonging to the given group of the survey.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.groupName - Auth group name (e.g. dataCleanser).
 * @returns {object} The user.
 */
export const newSurveyUser = ({ survey, groupName }: { survey: any; groupName: string }) => ({
  uuid: `user-${groupName}`,
  authGroups: [{ name: groupName, surveyUuid: Survey.getUuid(Survey.getSurveyInfo(survey)) }],
})

/**
 * Returns a tool context for the analysis tools.
 * @param {object} params - Parameters (any context prop can be overridden).
 * @param {object} params.survey - The survey.
 * @param {object} [params.user] - The user (system admin by default).
 * @returns {object} The context.
 */
export const newAnalysisToolContext = ({
  survey,
  user = adminUser,
  ...props
}: {
  survey: any
  user?: any
  [key: string]: any
}) => {
  const surveyInfo = survey ? Survey.getSurveyInfo(survey) : null
  return {
    getState: () => ({}),
    dispatch: () => undefined,
    user,
    survey,
    cycle: Survey.cycleOneKey,
    lang: 'en',
    uiLang: 'en',
    signal: new AbortController().signal,
    // computed with the Authorizer, as the real context does
    canViewSurvey: surveyInfo ? Authorizer.canViewSurvey(user, surveyInfo) : false,
    canEditSurvey: surveyInfo ? Authorizer.canEditSurvey(user, surveyInfo) : false,
    t: fakeT,
    analysisQueries: createAnalysisQueryStore(),
    ...props,
  } as any
}

/**
 * Returns a fake analysis API recording its calls.
 * @param {object} [overrides] - Implementations of some API functions.
 * @returns {{api: AnalysisApi, calls: object[]}} The API and the recorded calls.
 */
export const newFakeAnalysisApi = (overrides: Partial<Record<keyof AnalysisApi, (params: any) => unknown>> = {}) => {
  const calls: { name: string; params: any }[] = []
  const names: (keyof AnalysisApi)[] = [
    'fetchQueryRows',
    'fetchQueryCount',
    'fetchRecordsCountByStep',
    'fetchRecordsCountByDay',
    'fetchCategoryItems',
  ]
  const api = Object.fromEntries(
    names.map((name) => [
      name,
      async (params: any) => {
        calls.push({ name, params })
        const impl = overrides[name]
        return impl ? impl(params) : null
      },
    ])
  ) as unknown as AnalysisApi
  return { api, calls }
}

/**
 * Validates the input with the tool's schema (as the AI SDK does), then runs the tool.
 * @param {object} tool - The tool.
 * @param {object} input - The raw input.
 * @param {object} ctx - The tool context.
 * @returns {Promise<any>} The tool output.
 */
export const runTool = async (tool: any, input: unknown, ctx: any) => tool.execute(tool.inputSchema.parse(input), ctx)
