import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import type { CleaningApi } from '@webapp/ai/tools/cleaning/cleaningApi'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

import { adminUser, newAnalysisToolContext, newSurveyUser } from './aiAnalysisTestUtils'

export { runTool } from './aiAnalysisTestUtils'

export const cleaningAdminUser = adminUser

// translator that shows the keys, so tests don't depend on the English texts
export const fakeI18n = {
  language: 'en',
  t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  exists: () => true,
}

/**
 * Sets survey info props on a survey built by the survey builder (info at the top level or under `info`).
 * @param {object} survey - The survey.
 * @param {object} props - Info props to set.
 * @returns {object} The updated survey.
 */
const withInfoProps = (survey: any, props: Record<string, unknown>) =>
  survey.info ? { ...survey, info: { ...survey.info, ...props } } : { ...survey, ...props }

/**
 * Builds the test survey of DataTest (cluster / plot / tree), published, with id 1.
 * @returns {Promise<object>} The survey.
 */
export const cleaningTestSurvey = async () =>
  withInfoProps(await DataTest.createTestSurvey({ user: getContextUser() }), { id: 1, published: true })

/**
 * Builds the test record of DataTest for the survey, with its survey uuid, step and owner.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} [params.step] - Record step ('1' entry, '2' cleansing, '3' analysis).
 * @param {string} [params.ownerUuid] - Owner uuid.
 * @returns {object} The record.
 */
export const cleaningTestRecord = ({ survey, step = '1', ownerUuid = 'record-owner' }: any) => {
  const record = DataTest.createTestRecord({ user: getContextUser(), survey })
  return {
    ...record,
    [Record.keys.surveyUuid]: Survey.getUuid(Survey.getSurveyInfo(survey)),
    [Record.keys.step]: step,
    [Record.keys.ownerUuid]: ownerUuid,
  }
}

/**
 * Returns a user of the given default group of the survey.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.groupName - Group name (dataEditor, dataCleanser, surveyAdmin…).
 * @param {string} [params.uuid] - User uuid.
 * @returns {object} The user.
 */
export const newCleaningSurveyUser = ({
  survey,
  groupName,
  uuid,
}: {
  survey: any
  groupName: string
  uuid?: string
}) => {
  const user = newSurveyUser({ survey, groupName })
  // the default group brings the permissions and record steps the Authorizer reads
  const group = Survey.getDefaultAuthGroups().find((authGroup: any) => authGroup.name === groupName)
  return { ...user, uuid: uuid ?? user.uuid, authGroups: [{ ...group, ...user.authGroups[0] }] }
}

/**
 * Returns a tool context for the cleaning tools; proposed change sets are collected in `changeSets`.
 * @param {object} params - Parameters (any context prop can be overridden).
 * @param {object} params.survey - The survey.
 * @param {object} [params.user] - The user (system admin by default).
 * @returns {object} The context.
 */
export const newCleaningToolContext = (params: { survey: any; user?: any; [key: string]: any }) => {
  const changeSets: any[] = []
  return newAnalysisToolContext({
    getCurrentView: () => null,
    onChangeSet: (changeSet: any) => {
      changeSets.push(changeSet)
    },
    changeSets,
    ...params,
  })
}

const cleaningApiNames: (keyof CleaningApi)[] = [
  'fetchValidationReportRows',
  'countValidationReportRows',
  'fetchRecordAndNodes',
  'searchRecordsSummary',
  'fetchCategoryItems',
  'findTaxa',
]

/**
 * Returns a fake cleaning API recording its calls.
 * @param {object} [overrides] - Implementations of some API functions.
 * @returns {{api: CleaningApi, calls: object[]}} The API and the recorded calls.
 */
export const newFakeCleaningApi = (overrides: Partial<Record<keyof CleaningApi, (params: any) => unknown>> = {}) => {
  const calls: { name: string; params: any }[] = []
  const api = Object.fromEntries(
    cleaningApiNames.map((name) => [
      name,
      async (params: any) => {
        calls.push({ name, params })
        const impl = overrides[name]
        return impl ? impl(params) : null
      },
    ])
  ) as unknown as CleaningApi
  return { api, calls }
}

/**
 * Returns the entity ancestors of a node, root first.
 * @param {object} record - The record.
 * @param {object} node - The node.
 * @returns {object[]} The ancestors.
 */
const getAncestorsRootFirst = (record: any, node: any): any[] => {
  const ancestors: any[] = []
  let current = Record.getParentNode(node)(record)
  while (current) {
    ancestors.unshift(current)
    current = Record.getParentNode(current)(record)
  }
  return ancestors
}

/**
 * Builds a validation report row for a node, as the server returns it.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node with the validation.
 * @param {object} params.validation - Its validation.
 * @returns {object} The report row.
 */
export const newValidationRow = ({ survey, record, node, validation }: any) => {
  const keysOf = (entity: any) => {
    const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)
    const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
    return Object.fromEntries(
      keyDefs.map((keyDef: any) => [
        NodeDef.getName(keyDef),
        Node.getValue(Record.getNodeChildByDefUuid(entity, NodeDef.getUuid(keyDef))(record)),
      ])
    )
  }
  return {
    recordUuid: Record.getUuid(record),
    recordStep: Record.getStep(record),
    recordOwnerUuid: Record.getOwnerUuid(record),
    recordCycle: Record.getCycle(record),
    nodeUuid: Node.getUuid(node),
    nodeDefUuid: Node.getNodeDefUuid(node),
    keysHierarchy: getAncestorsRootFirst(record, node).map((entity) => ({
      nodeDefUuid: Node.getNodeDefUuid(entity),
      nodeUuid: Node.getUuid(entity),
      keys: keysOf(entity),
    })),
    keysSelf: {},
    validation,
  }
}

/**
 * Builds a validation with one error or warning.
 * @param {string} key - Message key.
 * @param {'error'|'warning'} [severity] - Severity.
 * @returns {object} The validation.
 */
export const newValidation = (key: string, severity: 'error' | 'warning' = 'error') => ({
  valid: severity !== 'error',
  errors: severity === 'error' ? [{ key }] : [],
  warnings: severity === 'warning' ? [{ key }] : [],
  fields: {},
})
