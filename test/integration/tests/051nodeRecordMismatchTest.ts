import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as RecordApi from '@server/modules/record/api/recordApi'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { requireNodeUuidBelongsToRecord } from '@server/modules/record/api/recordNodeOwnership'

import { callHandler, createFakeResponse } from '../../unit/utils/fakeExpress'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import { collectRoutes, getRouteHandler } from '@test/utils/routeUtils'

describe('Per-node endpoint: node of another record', () => {
  let survey: any
  let recordA: any
  let recordB: any

  beforeAll(async () => {
    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity('root', SB.attribute('root_key').key(), SB.attribute('num', NodeDef.nodeDefType.integer))
    ).buildAndStore()
    recordA = await RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('root_key', 'a'), RB.attribute('num', 1))
    ).buildAndStore()
    recordB = await RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('root_key', 'b'), RB.attribute('num', 2))
    ).buildAndStore()
  })

  // the route handler, run after the permission and qualifier middlewares
  const runNodeHandler = async ({ query = {}, body = {} }: { query?: object; body?: object }) => {
    const handler = getRouteHandler(
      RecordApi.init,
      ({ method, path }) => method === 'post' && path === '/survey/:surveyId/record/:recordUuid/node'
    )
    const req: any = {
      params: { surveyId: String(Survey.getId(survey)), recordUuid: Record.getUuid(recordA) },
      query,
      body,
      user: getContextUser(),
    }
    const next = jest.fn()
    await callHandler(handler, req, createFakeResponse(), next)
    return next
  }

  test('a node of record B sent to the URL of record A is refused by the route handler and B is unchanged', async () => {
    const surveyId = Survey.getId(survey)
    const nodeB = RecordUtils.findNodeByPath('root/num')(survey, recordB)

    const next = await runNodeHandler({ body: { node: JSON.stringify(Node.assocValue(99)(nodeB)) } })

    expect(next.mock.calls[0][0]).toMatchObject({ name: 'UnauthorizedError' })
    const nodeBDb = await RecordManager.fetchNodeByUuid(surveyId, Node.getUuid(nodeB))
    expect(Node.getValue(nodeBDb)).toBe(2)
  })

  // the qualifier middleware reads the body only: a node in the query would skip its check
  test('a node sent only in the query string is refused and not saved', async () => {
    const surveyId = Survey.getId(survey)
    const nodeA = RecordUtils.findNodeByPath('root/num')(survey, recordA)

    const next = await runNodeHandler({ query: { node: JSON.stringify(Node.assocValue(99)(nodeA)) } })

    expect(next.mock.calls[0][0]).toMatchObject({ name: 'UnauthorizedError' })
    const nodeADb = await RecordManager.fetchNodeByUuid(surveyId, Node.getUuid(nodeA))
    expect(Node.getValue(nodeADb)).toBe(1)
  })

  test('the delete route checks the node record right after the edit permission', () => {
    const route = collectRoutes(RecordApi.init).find(
      ({ method, path }) => method === 'delete' && path === '/survey/:surveyId/record/:recordUuid/node/:nodeUuid'
    )
    expect(route).toBeDefined()
    expect(route?.handlers.indexOf(requireNodeUuidBelongsToRecord)).toBe(1)
  })

  test('deleting a node of record B through the URL of record A is refused and the node still exists', async () => {
    const surveyId = Survey.getId(survey)
    const nodeB = RecordUtils.findNodeByPath('root/num')(survey, recordB)
    const nodeUuid = Node.getUuid(nodeB)
    const req: any = {
      params: { surveyId: String(surveyId), recordUuid: Record.getUuid(recordA), nodeUuid },
      query: {},
      body: {},
    }
    const res = createFakeResponse()
    const next = jest.fn()

    await requireNodeUuidBelongsToRecord(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(await RecordManager.fetchNodeByUuid(surveyId, nodeUuid)).toBeTruthy()

    // the node of the right record passes
    const reqOk: any = { ...req, params: { ...req.params, recordUuid: Record.getUuid(recordB) } }
    const nextOk = jest.fn()
    await requireNodeUuidBelongsToRecord(reqOk, createFakeResponse(), nextOk)
    expect(nextOk).toHaveBeenCalledWith()
  })
})
