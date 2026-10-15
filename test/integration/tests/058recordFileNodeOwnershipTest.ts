import * as AuthGroup from '@core/auth/authGroup'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as SurveyFile from '@core/survey/surveyFile'
import { uuidv4 } from '@core/uuid'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as RecordApi from '@server/modules/record/api/recordApi'
import { requireNodeUuidBelongsToRecord } from '@server/modules/record/api/recordNodeOwnership'
import { requireRecordMatchesUserGroupQualifiers } from '@server/modules/record/api/recordQualifierMiddleware'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import * as SB from '@test/utils/surveyBuilder'
import * as RB from '@test/utils/recordBuilder'
import * as RecordUtils from '@test/utils/recordUtils'
import { createSurveyMember, deleteUsers } from '@test/utils/routePermissionTestUtils'
import { ArenaServer } from '@openforis/arena-server'

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

const filePath = '/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file'
const fileExifPath = '/survey/:surveyId/record/:recordUuid/nodes/:nodeUuid/file-exif'

/**
 * Runs the handlers of a route one after the other, as Express does, until one of them does not call next.
 * @param {Route} route - The route.
 * @param {object} req - The request.
 * @param {object} res - The response.
 * @returns {Promise<{error: any, reachedEnd: boolean}>} The error passed to next, and whether the chain completed.
 */
const runChain = async (route: Route, req: any, res: any): Promise<{ error: any; reachedEnd: boolean }> => {
  let error: any
  for (const handler of route.handlers) {
    let calledNext = false
    // the last handler (the route itself) answers through res or next(error)
    await handler(req, res, (nextError?: any) => {
      calledNext = true
      error = nextError
    })
    if (!calledNext || error) return { error, reachedEnd: false }
  }
  return { error, reachedEnd: true }
}

describe('Record file routes: node of another record (058)', () => {
  let user: any
  let viewer: any
  let surveyId: number
  let recordA: any
  let recordB: any
  let fileNodeUuidA: string
  let fileNodeUuidB: string
  const fileContentB = Buffer.from('content of the file of record B')

  const buildRequest = ({ recordUuid, nodeUuid }: { recordUuid: string; nodeUuid: string }) => ({
    params: { surveyId: String(surveyId), recordUuid, nodeUuid },
    query: {},
    body: {},
    user: viewer,
  })

  beforeAll(async () => {
    user = getContextUser()
    ArenaServer.initServices()
    const survey = await SB.survey(
      user,
      SB.entity('root', SB.attribute('root_key').key(), SB.attribute('attachment', NodeDef.nodeDefType.file))
    ).buildAndStore()
    surveyId = Survey.getId(survey)
    const buildRecord = (key: string, fileUuid: string) =>
      RB.record(
        user,
        survey,
        RB.entity(
          'root',
          RB.attribute('root_key', key),
          RB.attribute('attachment', Node.newNodeValueFile({ fileUuid, fileName: `${key}.txt` }))
        )
      ).buildAndStore()
    const fileUuidA = uuidv4()
    const fileUuidB = uuidv4()
    recordA = await buildRecord('a', fileUuidA)
    recordB = await buildRecord('b', fileUuidB)
    const insertFile = async ({ record, fileUuid, content }: { record: any; fileUuid: string; content: Buffer }) => {
      const node = RecordUtils.findNodeByPath('root/attachment')(survey, record)
      await SurveyFileService.insertFile(
        surveyId,
        SurveyFile.createFileFromNode({ node: Node.assocValue({ fileUuid, fileName: 'f.txt' })(node), content })
      )
      return Node.getUuid(node)
    }
    fileNodeUuidA = await insertFile({ record: recordA, fileUuid: fileUuidA, content: Buffer.from('content of A') })
    fileNodeUuidB = await insertFile({ record: recordB, fileUuid: fileUuidB, content: fileContentB })
    viewer = await createSurveyMember({ admin: user, surveyId, groupName: AuthGroup.groupNames.dataEditor })
  })

  afterAll(async () => {
    await deleteUsers([viewer])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test.each([filePath, fileExifPath])(
    'the route %s checks the view permission, then the node record, then the group qualifiers',
    (path) => {
      const route = collectRoutes(RecordApi.init).find(
        ({ method, path: routePath }) => method === 'get' && routePath === path
      )
      expect(route).toBeDefined()
      expect(route?.handlers.slice(0, 3)).toEqual([
        AuthMiddleware.requireRecordViewPermission,
        requireNodeUuidBelongsToRecord,
        requireRecordMatchesUserGroupQualifiers,
      ])
    }
  )

  test('a viewer of record A cannot read the file of record B, through its node uuid in the URL of record A', async () => {
    const route = collectRoutes(RecordApi.init).find(({ method, path }) => method === 'get' && path === filePath)
    const res = createFakeResponse()

    const { reachedEnd } = await runChain(
      route as Route,
      buildRequest({ recordUuid: Record.getUuid(recordA), nodeUuid: fileNodeUuidB }),
      res
    )

    expect(reachedEnd).toBe(false)
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'appErrors:record.nodeNotInRecord' })
    expect(res.writes).toEqual([])
  })

  test('the file-exif route refuses the node of another record too', async () => {
    const route = collectRoutes(RecordApi.init).find(({ method, path }) => method === 'get' && path === fileExifPath)
    const res = createFakeResponse()

    const { reachedEnd } = await runChain(
      route as Route,
      buildRequest({ recordUuid: Record.getUuid(recordA), nodeUuid: fileNodeUuidB }),
      res
    )

    expect(reachedEnd).toBe(false)
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'appErrors:record.nodeNotInRecord' })
  })

  test('a malformed node uuid is refused', async () => {
    const route = collectRoutes(RecordApi.init).find(({ method, path }) => method === 'get' && path === filePath)
    const res = createFakeResponse()

    const { reachedEnd } = await runChain(
      route as Route,
      buildRequest({ recordUuid: Record.getUuid(recordA), nodeUuid: 'not-a-uuid' }),
      res
    )

    expect(reachedEnd).toBe(false)
    expect(res.statusCode).toBe(400)
  })

  test('the file of the node of the URL record is still served', async () => {
    const route = collectRoutes(RecordApi.init).find(({ method, path }) => method === 'get' && path === filePath)
    const res = createFakeResponse()
    const chunks: Buffer[] = []
    res.write = (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk))
      return true
    }
    const finished = new Promise<void>((resolve) => res.once('finish', resolve))

    // the route handler pipes the stored content to the response
    await runChain(route as Route, buildRequest({ recordUuid: Record.getUuid(recordB), nodeUuid: fileNodeUuidB }), res)
    await finished

    expect(res.statusCode).toBe(200)
    expect(Buffer.concat(chunks).toString()).toBe(fileContentB.toString())
    // record A's own file node is served for record A
    expect(fileNodeUuidA).not.toBe(fileNodeUuidB)
  })
})
