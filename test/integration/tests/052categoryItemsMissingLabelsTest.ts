import { UnauthorizedError } from '@openforis/arena-server'

import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import { uuidv4 } from '@core/uuid'

import * as CategoryApi from '@server/modules/category/api/categoryApi'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryItemLabelsManager from '@server/modules/category/manager/categoryItemLabelsManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import * as SB from '@test/utils/surveyBuilder'
import { buildUserWithoutGroups, runRoutePermission } from '@test/utils/routePermissionTestUtils'

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

/**
 * Returns the uuid of every item of a built category by code path ("1.2").
 * @param {object} builder - Category builder (build() is memoized).
 * @returns {Map<string, string>} Uuid by code path.
 */
const uuidsByPath = (builder: any): Map<string, string> => {
  const { items } = builder.build()
  const byUuid = new Map<string, any>(items.map((item: any) => [CategoryItem.getUuid(item), item]))
  const pathOf = (item: any): string[] => {
    const parent = byUuid.get(CategoryItem.getParentUuid(item))
    return [...(parent ? pathOf(parent) : []), CategoryItem.getCode(item)]
  }
  return new Map(items.map((item: any) => [pathOf(item).join('.'), CategoryItem.getUuid(item)]))
}

// species: genus 1 (1.1, 1.2) and 2 (2.1); land_use: A, B, C
const SPECIES_LABELS: Record<string, Record<string, string>> = {
  '1': { en: 'Acacia' },
  '1.1': { en: 'Acacia nilotica', fr: 'Acacia du Nil' },
  '1.2': { en: 'Acacia senegal' },
  '2': { en: 'Pinus' },
  '2.1': { en: 'Pinus nigra', fr: '  ' },
}
const LAND_USE_LABELS: Record<string, Record<string, string>> = {
  A: { en: 'Forest' },
  B: { en: 'Cropland', es: 'Cultivo' },
  C: {},
}

const refsOf = (page: any): string[] => page.items.map((item: any) => item.codePath.join('.'))

describe('Category items missing labels (052)', () => {
  // the context user exists only once the global setup ran: read it in beforeAll
  let user: any
  const species = SB.category('species')
    .levels('genus', 'species')
    .items(
      SB.categoryItem('1').items(SB.categoryItem('1'), SB.categoryItem('2')),
      SB.categoryItem('2').items(SB.categoryItem('1'))
    )
  const landUse = SB.category('land_use')
    .levels('class')
    .items(SB.categoryItem('A'), SB.categoryItem('B'), SB.categoryItem('C'))
  let surveyId: number
  let speciesUuid: string
  let landUseUuid: string
  let speciesItems: Map<string, string>
  let singleLanguageSurveyId: number

  const setLabels = async (categoryUuid: string, uuids: Map<string, string>, labels: Record<string, any>) => {
    for (const [path, value] of Object.entries(labels)) {
      await CategoryManager.updateItemProp(
        user,
        surveyId,
        categoryUuid,
        uuids.get(path),
        CategoryItem.keysProps.labels,
        value
      )
    }
  }

  const fetchPage = (params: Record<string, unknown>) =>
    CategoryItemLabelsManager.fetchItemsMissingLabels({ surveyId, categoryUuid: speciesUuid, ...params } as any)

  const expectInvalid = async (promise: Promise<unknown>, reason: string) => {
    await expect(promise).rejects.toMatchObject({
      key: 'appErrors:categoryItemLabelsInvalid',
      params: { reason },
      statusCode: 400,
    })
  }

  beforeAll(async () => {
    user = getContextUser()
    const survey = await SB.survey(user, SB.entity('root', SB.attribute('root_key').key()))
      .categories(species, landUse)
      .buildAndStore()
    surveyId = Survey.getId(survey)
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.languages, ['en', 'fr', 'es'])
    speciesUuid = species.build().category.uuid
    landUseUuid = landUse.build().category.uuid
    speciesItems = uuidsByPath(species)
    await setLabels(speciesUuid, speciesItems, SPECIES_LABELS)
    await setLabels(landUseUuid, uuidsByPath(landUse), LAND_USE_LABELS)

    const single = await SB.survey(user, SB.entity('root', SB.attribute('root_key').key()))
      .categories(SB.category('colors').levels('color').items(SB.categoryItem('1').label('Red')))
      .buildAndStore()
    singleLanguageSurveyId = Survey.getId(single)
  })

  afterAll(async () => {
    await SurveyManager.deleteSurvey(surveyId, {})
    await SurveyManager.deleteSurvey(singleLanguageSurveyId, {})
  })

  test('counts the missing labels per category and language, over the combined draft props', async () => {
    expect(await CategoryItemLabelsManager.countItemsMissingLabels({ surveyId })).toEqual({
      [speciesUuid]: { fr: 4, es: 5 },
      [landUseUuid]: { fr: 2, es: 1 },
    })
  })

  test('a survey with one language has nothing missing', async () => {
    expect(await CategoryItemLabelsManager.countItemsMissingLabels({ surveyId: singleLanguageSurveyId })).toEqual({})
  })

  test('pages in level, then code path order; nextCursor is the uuid of the last item', async () => {
    const first = await fetchPage({ lang: 'fr', limit: 2 })
    expect(refsOf(first)).toEqual(['1', '2'])
    expect(first.total).toBe(4)
    expect(first.nextCursor).toBe(speciesItems.get('2'))
    expect(first.items[0]).toEqual({
      uuid: speciesItems.get('1'),
      levelIndex: 0,
      levelName: 'genus',
      codePath: ['1'],
      labels: { en: 'Acacia' },
    })
    const second = await fetchPage({ lang: 'fr', limit: 2, cursor: first.nextCursor })
    expect(refsOf(second)).toEqual(['1.2', '2.1'])
    expect(second).toMatchObject({ total: 4, nextCursor: null })
    expect(refsOf(await fetchPage({ lang: 'es' }))).toEqual(['1', '2', '1.1', '1.2', '2.1'])
  })

  test('a cursor on an item that was filled meanwhile still pages on; an unknown cursor restarts', async () => {
    // 1.1 has a French label: it is not in the list, but a cursor on it keeps its place
    expect(refsOf(await fetchPage({ lang: 'fr', cursor: speciesItems.get('1.1') }))).toEqual(['1.2', '2.1'])
    expect(refsOf(await fetchPage({ lang: 'fr', cursor: uuidv4() }))).toEqual(['1', '2', '1.2', '2.1'])
    expect(refsOf(await fetchPage({ lang: 'fr', cursor: '' }))).toEqual(['1', '2', '1.2', '2.1'])
  })

  test('refuses a foreign language, a bad cursor or limit, an unknown category', async () => {
    expect.hasAssertions()
    await expectInvalid(fetchPage({ lang: 'de' }), 'lang')
    await expectInvalid(fetchPage({ lang: 'fr', cursor: 'abc' }), 'cursor')
    await expectInvalid(fetchPage({ lang: 'fr', limit: 0 }), 'limit')
    await expectInvalid(fetchPage({ lang: 'fr', limit: '201' }), 'limit')
    await expectInvalid(fetchPage({ lang: 'fr', limit: 'x' }), 'limit')
    await expectInvalid(fetchPage({ lang: 'fr', categoryUuid: uuidv4() }), 'category')
    await expectInvalid(fetchPage({ lang: 'fr', categoryUuid: 'items' }), 'category')
  })

  test('the routes require the survey edit permission and answer through the manager', async () => {
    const routes = collectRoutes(CategoryApi.init)
    const countsRoute = routes.find(
      ({ method, path }) => method === 'get' && path === '/survey/:surveyId/categories/items/missing-labels'
    )
    const pageRoute = routes.find(
      ({ method, path }) =>
        method === 'get' && path === '/survey/:surveyId/categories/:categoryUuid/items/missing-labels'
    )
    expect(countsRoute?.handlers[0]).toBe(AuthMiddleware.requireSurveyEditPermission)
    expect(pageRoute?.handlers[0]).toBe(AuthMiddleware.requireSurveyEditPermission)

    // a user without the edit permission is refused (UnauthorizedError, the API error handler answers 403); an editor passes
    const outsider = buildUserWithoutGroups(user)
    for (const route of [countsRoute, pageRoute]) {
      const refused = await runRoutePermission({ route, user: outsider, surveyId })
      expect(refused).toBeInstanceOf(UnauthorizedError)
      expect(await runRoutePermission({ route, user, surveyId })).toBeUndefined()
    }

    const countsRes = createFakeResponse()
    await countsRoute?.handlers[1]({ params: { surveyId: String(surveyId) }, query: {}, body: {}, user }, countsRes)
    expect(countsRes.body[speciesUuid]).toEqual({ fr: 4, es: 5 })

    const pageRes = createFakeResponse()
    const params = { surveyId: String(surveyId), categoryUuid: speciesUuid }
    await pageRoute?.handlers[1](
      { params, query: { lang: 'fr', cursor: speciesItems.get('1'), limit: '2' }, body: {}, user },
      pageRes
    )
    expect(refsOf(pageRes.body)).toEqual(['2', '1.2'])

    const badRes = createFakeResponse()
    await pageRoute?.handlers[1]({ params, query: { lang: 'fr', cursor: 'abc' }, body: {}, user }, badRes)
    expect(badRes.statusCode).toBe(400)
    expect(badRes.body).toEqual({
      status: 'error',
      key: 'appErrors:categoryItemLabelsInvalid',
      params: { reason: 'cursor' },
    })
  })
})
