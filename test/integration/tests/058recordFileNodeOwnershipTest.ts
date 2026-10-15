import { ServiceRegistry } from '@openforis/arena-core'

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
import {
  requireRecordMatchesUserGroupQualifiers,
  requireRecordMatchesUserGroupQualifiersRead,
} from '@server/modules/record/api/recordQualifierMiddleware'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyApi from '@server/modules/survey/api/surveyApi'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import * as SB from '@test/utils/surveyBuilder'
import * as RB from '@test/utils/recordBuilder'
import * as RecordUtils from '@test/utils/recordUtils'
import { createSurveyMember, deleteUsers } from '@test/utils/routePermissionTestUtils'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

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
        requireRecordMatchesUserGroupQualifiersRead,
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

describe('Record read routes: user group qualifiers (058)', () => {
  let user: any
  let southViewer: any
  let surveyId: number
  let survey: any
  let groupUuid: string
  let recordNorth: any
  let recordSouth: any
  let teamDefUuid: string
  let fileNodeUuidNorth: string
  let fileNodeUuidSouth: string

  const route = (method: string, path: string, init: (app: any) => void = RecordApi.init): Route =>
    collectRoutes(init).find((r) => r.method === method && r.path === path) as Route

  const recordPath = '/survey/:surveyId/record'
  const docxPath = '/survey/:surveyId/record/:recordUuid/export/docx'
  const pdfPath = '/survey/:surveyId/record/:recordUuid/export/pdf'

  // a node of the qualifier attribute, as a client would send it to fake the group of the record
  const fakeTeamNode = (recordUuid: string) =>
    JSON.stringify({ uuid: uuidv4(), recordUuid, nodeDefUuid: teamDefUuid, value: 'south' })

  const request = ({
    recordUuid,
    nodeUuid = null,
    withNode,
  }: {
    recordUuid: string
    nodeUuid?: string | null
    withNode: boolean
  }) => ({
    params: { surveyId: String(surveyId), ...(nodeUuid ? { recordUuid, nodeUuid } : { recordUuid }) },
    query: withNode ? { node: fakeTeamNode(recordUuid) } : {},
    body: {},
    user: southViewer,
  })

  beforeAll(async () => {
    user = getContextUser()
    ArenaServer.initServices()
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('team').prop(NodeDef.propKeys.qualifier, true),
        SB.attribute('attachment', NodeDef.nodeDefType.file)
      )
    ).buildAndStore()
    surveyId = Survey.getId(survey)
    teamDefUuid = NodeDef.getUuid(Survey.getNodeDefByName('team')(survey))
    const buildRecord = (key: string, team: string, fileUuid: string) =>
      RB.record(
        user,
        survey,
        RB.entity(
          'root',
          RB.attribute('root_key', key),
          RB.attribute('team', team),
          RB.attribute('attachment', Node.newNodeValueFile({ fileUuid, fileName: `${key}.txt` }))
        )
      ).buildAndStore()
    const fileUuidNorth = uuidv4()
    const fileUuidSouth = uuidv4()
    recordNorth = await buildRecord('north-1', 'north', fileUuidNorth)
    recordSouth = await buildRecord('south-1', 'south', fileUuidSouth)
    const insertFile = async ({ record, fileUuid }: { record: any; fileUuid: string }) => {
      const node = RecordUtils.findNodeByPath('root/attachment')(survey, record)
      await SurveyFileService.insertFile(
        surveyId,
        SurveyFile.createFileFromNode({
          node: Node.assocValue({ fileUuid, fileName: 'f.txt' })(node),
          content: Buffer.from(`content ${fileUuid}`),
        })
      )
      return Node.getUuid(node)
    }
    fileNodeUuidNorth = await insertFile({ record: recordNorth, fileUuid: fileUuidNorth })
    fileNodeUuidSouth = await insertFile({ record: recordSouth, fileUuid: fileUuidSouth })

    southViewer = await createSurveyMember({ admin: user, surveyId, groupName: AuthGroup.groupNames.dataEditor })
    const userGroupService: any = ServiceRegistry.getInstance().getService(ServerServiceType.userGroup)
    const group = await userGroupService.insert({
      surveyUuid: Survey.getUuid(Survey.getSurveyInfo(survey)),
      item: { props: { name: 'south', qualifiers: [{ name: 'team', value: 'south' }] } as any },
    })
    groupUuid = group.uuid
    await userGroupService.addMember({ groupUuid, userUuid: southViewer.uuid })
  })

  afterAll(async () => {
    await (ServiceRegistry.getInstance().getService(ServerServiceType.userGroup) as any).deleteItem({ uuid: groupUuid })
    await deleteUsers([southViewer])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test.each([false, true])('the file of another group record is refused (with ?node= %p)', async (withNode) => {
    const res = createFakeResponse()
    const { reachedEnd } = await runChain(
      route('get', filePath),
      request({ recordUuid: Record.getUuid(recordNorth), nodeUuid: fileNodeUuidNorth, withNode }),
      res
    )
    expect(reachedEnd).toBe(false)
    expect(res.statusCode).toBe(403)
  })

  test.each([false, true])('the record of another group is refused (with ?node= %p)', async (withNode) => {
    const res = createFakeResponse()
    const req = request({ recordUuid: Record.getUuid(recordNorth), withNode })
    req.query = { ...req.query, recordUuid: Record.getUuid(recordNorth) } as any
    await runChain(route('get', recordPath), req, res)
    expect(res.statusCode).toBe(403)
    // the 403 body is the unauthorized error, not the record
    expect(String(res.body)).toContain('userNotAuthorized')
  })

  test.each([docxPath, pdfPath])('the export %s of another group record is refused', async (path) => {
    const res = createFakeResponse()
    const { reachedEnd } = await runChain(
      route('get', path),
      request({ recordUuid: Record.getUuid(recordNorth), withNode: true }),
      res
    )
    expect(reachedEnd).toBe(false)
    expect(res.statusCode).toBe(403)
  })

  test.each([docxPath, pdfPath])('the export %s checks the group qualifiers after the view permission', (path) => {
    expect(route('get', path).handlers.slice(0, 2)).toEqual([
      AuthMiddleware.requireRecordViewPermission,
      requireRecordMatchesUserGroupQualifiersRead,
    ])
  })

  test('the record of the group of the user is still served (with and without ?node=)', async () => {
    for (const withNode of [false, true]) {
      const res = createFakeResponse()
      const req = request({ recordUuid: Record.getUuid(recordSouth), withNode })
      req.query = { ...req.query, recordUuid: Record.getUuid(recordSouth) } as any
      await runChain(route('get', recordPath), req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBeDefined()
    }
  })

  test('the file of the group of the user passes the checks', async () => {
    const res = createFakeResponse()
    const chain = route('get', filePath).handlers.slice(0, 3)
    const { reachedEnd } = await runChain(
      { ...route('get', filePath), handlers: chain },
      request({ recordUuid: Record.getUuid(recordSouth), nodeUuid: fileNodeUuidSouth, withNode: false }),
      res
    )
    expect(reachedEnd).toBe(true)
  })

  test('the write variant ignores ?node= in the query: it reads the pending node from the body only', async () => {
    const res = createFakeResponse()
    const req: any = request({ recordUuid: Record.getUuid(recordNorth), withNode: true })
    await runChain({ method: 'post', path: '', handlers: [requireRecordMatchesUserGroupQualifiers] }, req, res)
    expect(res.statusCode).toBe(403)
  })
})

describe('Survey file route: record attachments (058)', () => {
  let user: any
  let viewer: any
  let surveyId: number
  let attachmentFileUuid: string
  let mapLayerFileUuid: string
  const mapLayerContent = Buffer.from('map layer content')

  const callFileRoute = async (fileUuid: string) => {
    const handler = collectRoutes(SurveyApi.init)
      .find((r) => r.method === 'get' && r.path === '/survey/:surveyId/file/:fileUuid')!
      .handlers.at(-1)
    const res = createFakeResponse()
    const chunks: Buffer[] = []
    res.write = (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk))
      return true
    }
    const finished = new Promise<void>((resolve) => res.once('finish', resolve))
    await handler({ params: { surveyId: String(surveyId), fileUuid }, query: {}, body: {}, user: viewer }, res)
    if (res.statusCode === 200) await finished
    return { res, content: Buffer.concat(chunks) }
  }

  beforeAll(async () => {
    user = getContextUser()
    ArenaServer.initServices()
    const survey = await SB.survey(user, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    attachmentFileUuid = uuidv4()
    mapLayerFileUuid = uuidv4()
    await SurveyFileService.insertFile(
      surveyId,
      SurveyFile.createFile({
        uuid: attachmentFileUuid,
        name: 'attachment.txt',
        recordUuid: uuidv4(),
        nodeUuid: uuidv4(),
        type: SurveyFile.SurveyFileType.recordAttachment,
        content: Buffer.from('secret attachment'),
      })
    )
    await SurveyFileService.insertFile(
      surveyId,
      SurveyFile.createFile({
        uuid: mapLayerFileUuid,
        name: 'layer.geojson',
        type: SurveyFile.SurveyFileType.preloadedMapLayer,
        content: mapLayerContent,
      })
    )
    viewer = await createSurveyMember({ admin: user, surveyId, groupName: AuthGroup.groupNames.dataEditor })
  })

  afterAll(async () => {
    await deleteUsers([viewer])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test('a record attachment is not served by the survey file route', async () => {
    const { res } = await callFileRoute(attachmentFileUuid)
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({ key: 'appErrors:survey.fileNotFound' })
  })

  test('a map layer file is still served', async () => {
    const { res, content } = await callFileRoute(mapLayerFileUuid)
    expect(res.statusCode).toBe(200)
    expect(content.toString()).toBe(mapLayerContent.toString())
  })
})
