import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { ENV } from '@core/processUtils'
import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { AiFeatureCategory } from '@common/ai/features'

import * as AiApi from '@server/modules/ai/api/aiApi'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import { readAiPrefs, writeAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'

import { getContextUser } from '@test/integration/config/context'
import { createSurveyMember, deleteUsers, runRouteChain } from '@test/utils/routePermissionTestUtils'
import { CollectedRoute, collectRoutes } from '@test/utils/routeUtils'
import * as SB from '@test/utils/surveyBuilder'

const API_KEY = 'sk-test-echo-8f3a91c2d4'
const NEW_API_KEY = 'sk-test-echo-new-77b0e615aa'
const UPSTREAM_TEXT = 'upstream said: internal host db.corp.local refused the request'
const SECRET = 'b'.repeat(64)

const COMPLETION = JSON.stringify({
  id: 'chatcmpl-1',
  object: 'chat.completion',
  created: 1,
  model: 'm',
  choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
})

// what the upstream answers instead of a completion: every one of them repeats the key it was called with
const echoes: [string, number, string][] = [
  [
    '401 with the key in the message',
    401,
    JSON.stringify({ error: { message: `Incorrect API key: ${API_KEY}. ${UPSTREAM_TEXT}` } }),
  ],
  ['403 with the key as plain text', 403, `forbidden for ${API_KEY} ${UPSTREAM_TEXT}`],
  ['429 with the key in the message', 429, JSON.stringify({ error: { message: `${API_KEY} ${UPSTREAM_TEXT}` } })],
  [
    '400 with the key in the message',
    400,
    JSON.stringify({ error: { message: `bad request from ${API_KEY} ${UPSTREAM_TEXT}` } }),
  ],
  ['500 with the key in the message', 500, JSON.stringify({ error: { message: `${API_KEY} ${UPSTREAM_TEXT}` } })],
  ['200 with an answer that is not a completion', 200, `not json ${API_KEY} ${UPSTREAM_TEXT}`],
]

describe('AI routes: an upstream that repeats the API key never gets it to the client (061)', () => {
  let server: http.Server
  let port: number
  let upstreamAnswer: { status: number; body: string }
  let upstreamAuthorization: string[]
  let aiRoutes: CollectedRoute[]
  let admin: any
  let surveyId: number
  let member: any
  let providerId: string
  let originalSecret: string | undefined
  const originalAiEnabled = ENV.aiFeaturesEnabled
  const originalAllowlist = ENV.aiOrgHostedBaseUrls

  const baseUrl = () => `http://127.0.0.1:${port}/v1`
  const route = (method: string, path: string) => {
    const found = aiRoutes.find((candidate) => candidate.method === method && candidate.path === path)
    expect(found).toBeDefined()
    return found
  }
  const answer = (status: number, body: string) => {
    upstreamAnswer = { status, body }
  }
  // the user as a request sees it: the whole row, the server-only prefs included
  const loadRequestUser = async (): Promise<any> => {
    const user = await UserManager.fetchUserByUuid(User.getUuid(member))
    return { ...user, prefs: { ...User.getPrefs(user), ai: await readAiPrefs({ userUuid: User.getUuid(member) }) } }
  }
  // a gateway request of the Help chat (login only: it needs no survey)
  const modelBody = (override: object) => ({
    feature: 'chatbot',
    dataClass: 'schema',
    stream: false,
    call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] },
    ...override,
  })
  // everything a client would receive
  const received = (res: any): string => JSON.stringify([res.statusCode, res.headers, res.body, res.writes])
  const expectNoLeak = (res: any) => {
    const text = received(res)
    expect(text).not.toContain(API_KEY)
    expect(text).not.toContain(NEW_API_KEY)
    expect(text).not.toContain('db.corp.local')
    expect(text).not.toContain('upstream said')
  }

  beforeAll(async () => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
    server = http.createServer((request, response) => {
      upstreamAuthorization.push(String(request.headers.authorization))
      request.resume()
      response.writeHead(upstreamAnswer.status, { 'content-type': 'application/json' })
      response.end(upstreamAnswer.body)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
    // the test server is on a loopback address: it is an organisation server
    ENV.aiOrgHostedBaseUrls = [`http://127.0.0.1:${port}`]

    admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    member = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
    await writeAiPrefs({
      userUuid: User.getUuid(member),
      aiPrefs: {
        accessLevel: 3,
        featuresEnabled: true,
        featureToggles: Object.fromEntries(Object.values(AiFeatureCategory).map((category) => [category, true])),
        providers: [],
      },
    })
    aiRoutes = collectRoutes(AiApi.init)

    // the provider is saved against a working endpoint, then the endpoint starts to echo the key
    ENV.aiFeaturesEnabled = true
    answer(200, COMPLETION)
    upstreamAuthorization = []
    const added = await runRouteChain({
      route: route('post', '/ai/providers'),
      user: await loadRequestUser(),
      body: { type: 'openai-compatible', name: 'Echo', model: 'm', baseUrl: baseUrl(), apiKey: API_KEY },
    })
    if (added.statusCode !== 200) throw new Error(`The provider was not saved: ${JSON.stringify(added.body)}`)
    providerId = added.body.provider.id
  })

  beforeEach(() => {
    ENV.aiFeaturesEnabled = true
    upstreamAuthorization = []
    answer(200, COMPLETION)
  })

  afterAll(async () => {
    ENV.aiFeaturesEnabled = originalAiEnabled
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
    await new Promise<void>((resolve) => {
      server.closeAllConnections()
      server.close(() => resolve())
    })
    if (member) await deleteUsers([member])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test('the saved provider reaches the upstream with its key, and the answer has no key (control)', async () => {
    const res = await runRouteChain({
      route: route('post', '/ai/model'),
      user: await loadRequestUser(),
      body: modelBody({ providerId, stream: false }),
    })
    expect(res.statusCode).toBe(200)
    expect(upstreamAuthorization).toEqual([`Bearer ${API_KEY}`])
    expectNoLeak(res)
  })

  test.each(echoes)('POST /ai/model (generate), upstream %s', async (_name, status, body) => {
    answer(status, body)
    const res = await runRouteChain({
      route: route('post', '/ai/model'),
      user: await loadRequestUser(),
      body: modelBody({ providerId, stream: false }),
    })
    expect(upstreamAuthorization.length).toBeGreaterThan(0)
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.body).toMatchObject({ status: 'error', key: expect.stringMatching(/^ai/) })
    expectNoLeak(res)
  })

  test.each(echoes.filter(([, status]) => status >= 400))(
    'POST /ai/model (stream), upstream %s',
    async (_name, status, body) => {
      answer(status, body)
      const res = await runRouteChain({
        route: route('post', '/ai/model'),
        user: await loadRequestUser(),
        body: modelBody({ providerId, stream: true }),
      })
      expect(upstreamAuthorization.length).toBeGreaterThan(0)
      // an error before the stream starts is a JSON error, one after it is an error frame: either way, a key only
      expect(res.statusCode >= 400 || res.writes.join('').includes('"type":"error"')).toBe(true)
      expectNoLeak(res)
    }
  )

  test('POST /ai/model (stream), upstream 200 with an answer that is not an event stream: an empty answer', async () => {
    answer(200, `not json ${API_KEY} ${UPSTREAM_TEXT}`)
    const res = await runRouteChain({
      route: route('post', '/ai/model'),
      user: await loadRequestUser(),
      body: modelBody({ providerId, stream: true }),
    })
    expect(res.writes.join('')).not.toContain('"type":"text')
    expectNoLeak(res)
  })

  describe.each([
    ['POST /ai/providers/test', 'post', '/ai/providers/test'],
    ['POST /ai/providers/models', 'post', '/ai/providers/models'],
    ['POST /ai/providers', 'post', '/ai/providers'],
  ])('%s with a key typed in the dialog', (_name, method, path) => {
    test.each(echoes)('upstream %s', async (_echo, status, body) => {
      answer(status, body)
      const res = await runRouteChain({
        route: route(method, path),
        user: await loadRequestUser(),
        body: { type: 'openai-compatible', name: 'Draft', model: 'm', baseUrl: baseUrl(), apiKey: API_KEY },
      })
      expect(upstreamAuthorization.length).toBeGreaterThan(0)
      expectNoLeak(res)
    })
  })

  test.each(echoes)('PUT /ai/providers/:id with a new key, upstream %s', async (_name, status, body) => {
    answer(status, body.replaceAll(API_KEY, NEW_API_KEY))
    const res = await runRouteChain({
      route: route('put', '/ai/providers/:id'),
      user: await loadRequestUser(),
      params: { id: providerId },
      body: { apiKey: NEW_API_KEY },
    })
    expect(upstreamAuthorization).toEqual([`Bearer ${NEW_API_KEY}`])
    expectNoLeak(res)
    // the key that failed was not saved
    expect(JSON.stringify(await readAiPrefs({ userUuid: User.getUuid(member) }))).not.toContain(NEW_API_KEY)
  })

  test('the settings never carry a key, in any form', async () => {
    const res = await runRouteChain({ route: route('get', '/ai/settings'), user: await loadRequestUser() })
    expect(res.statusCode).toBe(200)
    expect(res.body.providers).toHaveLength(1)
    const text = received(res)
    expect(text).not.toContain(API_KEY)
    expect(text).not.toContain('apiKeyEncrypted')
    expect(text).not.toContain('v2:')
  })
})
