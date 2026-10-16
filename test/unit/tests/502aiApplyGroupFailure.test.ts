import { applyChangeSet, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { getRequestFailure } from '@webapp/ai/changeSets/requestFailure'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { runTool } from '@webapp/ai/tools/registry'
import { getResultTitle } from '@webapp/components/ai/Assistant/changeItemModel'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey } from '@test/unit/utils/designSuggestionTestUtils'
import { fakeT as t } from '../utils/fakeT'

const axiosError = (data: unknown) =>
  Object.assign(new Error('Request failed with status code 400'), { response: { status: 400, data } })

describe('failed save request (502)', () => {
  test('the server key and params are kept; a key without namespace belongs to appErrors', () => {
    expect(getRequestFailure(axiosError({ key: 'validationErrors:nodeDefEdit.x', params: { name: 'a' } }))).toEqual({
      message: 'validationErrors:nodeDefEdit.x',
      params: { name: 'a' },
    })
    expect(getRequestFailure(axiosError({ key: 'survey.dataMigrationInProgress' }))).toEqual({
      message: 'appErrors:survey.dataMigrationInProgress',
      params: {},
    })
  })

  test('without a server key, the generic text carries the error message', () => {
    expect(getRequestFailure(axiosError({}))).toEqual({
      message: 'aiAssistant.card.applyFailed',
      params: { message: 'Request failed with status code 400' },
    })
    expect(getRequestFailure(axiosError({ key: '' })).message).toBe('aiAssistant.card.applyFailed')
    expect(getRequestFailure('boom')).toEqual({ message: 'aiAssistant.card.applyFailed', params: { message: 'boom' } })
    expect(getRequestFailure(undefined).message).toBe('aiAssistant.card.applyFailed')
  })

  describe('a group whose save is refused', () => {
    let survey: any
    let changeSet: ChangeSet

    beforeAll(async () => {
      survey = await buildRefSurvey()
      const ctx = createToolContext({ survey })
      await runTool(
        nodeDefProposeUpdateTool,
        { summary: 'Assign', changes: [{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }] },
        ctx
      )
      changeSet = ctx.changeSets[0] as ChangeSet
    })

    const applyWithPutError = (error: unknown) => {
      const deps: ApplierDeps = {
        getSurvey: () => survey,
        getCycle: () => '0',
        isSurveyDirty: () => false,
        postNodeDef: async () => undefined,
        putNodeDefProps: async () => {
          throw error
        },
        onNodeDefCreated: () => undefined,
        onNodeDefUpdated: () => undefined,
        onNodeDefSaved: () => undefined,
      }
      return applyChangeSet({ changeSet, operationIds: changeSet.operations.map((op) => op.id), deps })
    }

    test('the result carries the server key and params, which the card translates', async () => {
      const [result] = await applyWithPutError(
        axiosError({ key: 'appErrors:nodeDef.refEditNotAllowed', params: { name: 'region' } })
      )
      expect(result).toEqual({
        id: changeSet.operations[0].id,
        status: 'failed',
        message: 'appErrors:nodeDef.refEditNotAllowed',
        params: { name: 'region' },
      })
      expect(getResultTitle(result, t)).toBe('appErrors:nodeDef.refEditNotAllowed{"name":"region"}')
    })

    test('a transport error without a key falls back to the generic text', async () => {
      const [result] = await applyWithPutError(new Error('Network Error'))
      expect(result).toMatchObject({
        status: 'failed',
        message: 'aiAssistant.card.applyFailed',
        params: { message: 'Network Error' },
      })
    })
  })
})
