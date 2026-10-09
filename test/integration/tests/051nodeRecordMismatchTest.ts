import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as RecordApi from '@server/modules/record/api/recordApi'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { requireNodeBelongsToRecord } from '@server/modules/record/api/recordNodeOwnership'

import { createFakeResponse } from '../../unit/utils/fakeExpress'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

type Route = { method: string; path: string; handlers: any[] }

// collects the routes registered by an API module
const collectRoutes = (init: (app: any) => void): Route[] => {
  const routes: Route[] = []
  const app = new Proxy(
    {},
    {
      get:
        (_target, method: string) =>
        (path: string, ...handlers: any[]) => {
          routes.push({ method, path, handlers })
        },
    }
  )
  init(app)
  return routes
}

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

  test('the route checks the node record right after the edit permission', () => {
    const route = collectRoutes(RecordApi.init).find(
      ({ method, path }) => method === 'post' && path === '/survey/:surveyId/record/:recordUuid/node'
    )
    expect(route).toBeDefined()
    expect(route?.handlers.indexOf(requireNodeBelongsToRecord)).toBe(1)
  })

  test('a node of record B sent to the URL of record A is refused and B is unchanged', async () => {
    const surveyId = Survey.getId(survey)
    const nodeB = RecordUtils.findNodeByPath('root/num')(survey, recordB)
    const req: any = {
      params: { surveyId: String(surveyId), recordUuid: Record.getUuid(recordA) },
      query: {},
      body: { node: JSON.stringify(Node.assocValue(99)(nodeB)) },
    }
    const res = createFakeResponse()
    const next = jest.fn()

    requireNodeBelongsToRecord(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    const nodeBDb = await RecordManager.fetchNodeByUuid(surveyId, Node.getUuid(nodeB))
    expect(Node.getValue(nodeBDb)).toBe(2)
  })
})
