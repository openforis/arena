import { UnauthorizedError } from '@openforis/arena-server'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as ProcessUtils from '@core/processUtils'
import { uuidv4 } from '@core/uuid'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryApi from '@server/modules/category/api/categoryApi'
import * as CategoryItemLabelsManager from '@server/modules/category/manager/categoryItemLabelsManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

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

const COLORS = ['Red', 'Green', 'Blue', 'Yellow', 'Black', 'White', 'Grey']

describe('Category item labels update (053)', () => {
  let user: any
  const colors = SB.category('colors')
    .levels('color')
    .items(...COLORS.map((label, index) => SB.categoryItem(String(index + 1)).label(label)))
  let surveyId: number
  let categoryUuid: string
  let uuidByCode: Map<string, string>

  const update = (items: unknown) => CategoryItemLabelsManager.updateItemsLabels({ user, surveyId, items })

  const fetchStoredProps = (itemUuid: string): Promise<{ props: any; props_draft: any }> =>
    db.one(`SELECT props, props_draft FROM ${getSurveyDBSchema(surveyId)}.category_item WHERE uuid = $1`, [itemUuid])

  const countLabelActivities = async (itemUuid: string): Promise<number> => {
    const activities = await ActivityLogRepository.fetchSimple({ surveyId, limit: 1000, offset: 0 })
    return activities.filter(
      (activity: any) =>
        activity.type === ActivityLog.type.categoryItemPropUpdate &&
        activity.content?.uuid === itemUuid &&
        activity.content?.key === 'labels'
    ).length
  }

  const expectInvalid = async (items: unknown, reason: string) => {
    await expect(update(items)).rejects.toMatchObject({
      key: 'appErrors:categoryItemLabelsInvalid',
      params: { reason },
      statusCode: 400,
    })
  }

  beforeAll(async () => {
    user = getContextUser()
    // published (buildAndStore publishes): the labels are in props
    const survey = await SB.survey(user, SB.entity('root', SB.attribute('root_key').key()))
      .categories(colors)
      .buildAndStore()
    surveyId = Survey.getId(survey)
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.languages, ['en', 'fr'])
    categoryUuid = colors.build().category.uuid
    uuidByCode = new Map(
      colors.build().items.map((item: any) => [CategoryItem.getCode(item), CategoryItem.getUuid(item)])
    )
  })

  afterAll(async () => {
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test('writes only the language, in the draft props of a published survey', async () => {
    const itemUuid = uuidByCode.get('1') as string
    // the language change made the survey draft: start from a published, not draft survey
    await db.none('UPDATE survey SET draft = false WHERE id = $1', [surveyId])
    const activitiesBefore = await countLabelActivities(itemUuid)

    const answer = await update([{ itemUuid, lang: 'fr', text: 'Rouge', expectedText: null }])

    expect(answer.applied).toEqual([{ itemUuid, lang: 'fr' }])
    expect(answer.conflicts).toEqual([])
    expect(answer.categories.map((category: any) => Category.getUuid(category))).toEqual([categoryUuid])
    const { props, props_draft } = await fetchStoredProps(itemUuid)
    expect(props.labels).toEqual({ en: 'Red' })
    expect(props_draft.labels).toEqual({ en: 'Red', fr: 'Rouge' })
    const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true })
    expect(Survey.isDraft(surveyInfo)).toBe(true)
    const expectedActivities = ProcessUtils.ENV.activityLogDisabled ? 0 : 1
    expect((await countLabelActivities(itemUuid)) - activitiesBefore).toBe(expectedActivities)
  })

  test('a changed label is a conflict with the current text; the other items still apply', async () => {
    const green = uuidByCode.get('2') as string
    const blue = uuidByCode.get('3') as string
    // typed by hand after the proposal
    await CategoryManager.updateItemProp(user, surveyId, categoryUuid, green, CategoryItem.keysProps.labels, {
      en: 'Green',
      fr: 'Vert',
    })

    const answer = await update([
      { itemUuid: green, lang: 'fr', text: 'Verte', expectedText: null },
      { itemUuid: blue, lang: 'fr', text: 'Bleu', expectedText: null },
    ])

    expect(answer.conflicts).toEqual([{ itemUuid: green, lang: 'fr', reason: 'valueChanged', currentText: 'Vert' }])
    expect(answer.applied).toEqual([{ itemUuid: blue, lang: 'fr' }])
    expect((await fetchStoredProps(green)).props_draft.labels.fr).toBe('Vert')
    expect((await fetchStoredProps(blue)).props_draft.labels.fr).toBe('Bleu')
  })

  test('the expected text matches the current one: the label is replaced', async () => {
    const yellow = uuidByCode.get('4') as string
    await update([{ itemUuid: yellow, lang: 'fr', text: 'Jaune', expectedText: null }])
    const answer = await update([{ itemUuid: yellow, lang: 'fr', text: 'Jaune vif', expectedText: 'Jaune' }])
    expect(answer.applied).toEqual([{ itemUuid: yellow, lang: 'fr' }])
    expect((await fetchStoredProps(yellow)).props_draft.labels).toEqual({ en: 'Yellow', fr: 'Jaune vif' })
  })

  test('a blank label still matches a null expected text', async () => {
    const black = uuidByCode.get('5') as string
    await CategoryManager.updateItemProp(user, surveyId, categoryUuid, black, CategoryItem.keysProps.labels, {
      en: 'Black',
      fr: '  ',
    })
    const answer = await update([{ itemUuid: black, lang: 'fr', text: 'Noir', expectedText: null }])
    expect(answer.applied).toEqual([{ itemUuid: black, lang: 'fr' }])
  })

  test('a deleted item is an itemMissing conflict, not an error', async () => {
    const missing = uuidv4()
    const answer = await update([{ itemUuid: missing, lang: 'fr', text: 'Blanc', expectedText: null }])
    expect(answer).toEqual({
      applied: [],
      conflicts: [{ itemUuid: missing, lang: 'fr', reason: 'itemMissing', currentText: null }],
      categories: [],
    })
  })

  test('refuses a malformed request with its reason', async () => {
    const white = uuidByCode.get('6') as string
    const valid = { itemUuid: white, lang: 'fr', text: 'Blanc', expectedText: null }
    await expectInvalid(null, 'items')
    await expectInvalid([], 'items')
    await expectInvalid(
      Array.from({ length: 201 }, () => valid),
      'items'
    )
    await expectInvalid(['x'], 'item')
    await expectInvalid([{ ...valid, itemUuid: 'abc' }], 'item')
    await expectInvalid([{ ...valid, lang: 'de' }], 'lang')
    await expectInvalid([{ ...valid, text: '   ' }], 'text')
    await expectInvalid([{ ...valid, text: 'x'.repeat(2001) }], 'text')
    await expectInvalid([{ ...valid, expectedText: 3 }], 'expectedText')
    await expectInvalid([valid, { ...valid, text: 'Blanche' }], 'duplicate')
    // nothing was written
    expect((await fetchStoredProps(white)).props_draft?.labels?.fr).toBeUndefined()
  })

  test('an uppercase item uuid applies and is answered lower-cased; upper/lower duplicates are rejected', async () => {
    const grey = uuidByCode.get('7') as string
    const upper = grey.toUpperCase()
    await expectInvalid(
      [
        { itemUuid: upper, lang: 'fr', text: 'Gris', expectedText: null },
        { itemUuid: grey, lang: 'fr', text: 'Grise', expectedText: null },
      ],
      'duplicate'
    )
    const answer = await update([{ itemUuid: upper, lang: 'fr', text: 'Gris', expectedText: null }])
    expect(answer.applied).toEqual([{ itemUuid: grey, lang: 'fr' }])
    expect((await fetchStoredProps(grey)).props_draft.labels.fr).toBe('Gris')
  })

  test('the route requires the survey edit permission and reads the items from the body', async () => {
    const white = uuidByCode.get('6') as string
    const route = collectRoutes(CategoryApi.init).find(
      ({ method, path }) => method === 'put' && path === '/survey/:surveyId/categories/items/labels'
    )
    expect(route?.handlers[0]).toBe(AuthMiddleware.requireSurveyEditPermission)
    // a user without the edit permission is refused (UnauthorizedError, the API error handler answers 403); an editor passes
    const refused = await runRoutePermission({ route, user: buildUserWithoutGroups(user), surveyId })
    expect(refused).toBeInstanceOf(UnauthorizedError)
    expect(await runRoutePermission({ route, user, surveyId })).toBeUndefined()

    const res = createFakeResponse()
    const items = [{ itemUuid: white, lang: 'fr', text: 'Blanc', expectedText: null }]
    await route?.handlers[1]({ params: { surveyId: String(surveyId) }, query: {}, body: { items }, user }, res)
    expect(res.body.applied).toEqual([{ itemUuid: white, lang: 'fr' }])

    const badRes = createFakeResponse()
    await route?.handlers[1]({ params: { surveyId: String(surveyId) }, query: {}, body: { items: [] }, user }, badRes)
    expect(badRes.statusCode).toBe(400)
    expect(badRes.body).toEqual({
      status: 'error',
      key: 'appErrors:categoryItemLabelsInvalid',
      params: { reason: 'items' },
    })
  })
})
