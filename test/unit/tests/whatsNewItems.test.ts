/**
 * Tests for the "What's new" feature catalog and selectors:
 * - catalog consistency (unique ids, versions listed in CHANGELOG.md, English texts defined);
 * - visibility by audience and experimental flag;
 * - unseen items (dismissed items tracked by id in the user prefs).
 */
import fs from 'fs'
import path from 'path'

import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'
import * as WhatsNew from '@core/whatsNew/whatsNew'
import enWhatsNew from '@core/i18n/resources/en/whatsNew'

const { whatsNewAudiences, whatsNewItems } = WhatsNew

const userWithGroup = (groupName: string) => ({ authGroups: [{ name: groupName, surveyUuid: 'survey-1' }] })

const systemAdmin = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] }
const surveyAdmin = userWithGroup(AuthGroup.groupNames.surveyAdmin)
const dataEditor = userWithGroup(AuthGroup.groupNames.dataEditor)

const items: WhatsNew.WhatsNewItem[] = [
  { id: 'forAll', version: '1.0.2', audience: whatsNewAudiences.all },
  { id: 'forSurveyAdmins', version: '1.0.1', audience: whatsNewAudiences.surveyAdmin },
  { id: 'forSystemAdmins', version: '1.0.1', audience: whatsNewAudiences.systemAdmin },
  { id: 'experimentalForAll', version: '1.0.0', audience: whatsNewAudiences.all, experimental: true },
]

const ids = (itemsToMap: WhatsNew.WhatsNewItem[]) => itemsToMap.map((item) => item.id)

describe('WhatsNew catalog', () => {
  test('ids are unique', () => {
    const catalogIds = ids(whatsNewItems)
    expect(new Set(catalogIds).size).toBe(catalogIds.length)
  })

  test('every version is listed in CHANGELOG.md', () => {
    const changelog = fs.readFileSync(path.resolve(process.cwd(), 'CHANGELOG.md'), 'utf-8')
    whatsNewItems.forEach((item) => {
      expect(changelog).toContain(`**[${item.version}]`)
    })
  })

  test('every image exists in web-resources', () => {
    whatsNewItems
      .filter((item) => item.image)
      .forEach((item) => {
        expect(fs.existsSync(path.resolve(process.cwd(), 'web-resources', `.${item.image}`))).toBe(true)
      })
  })

  test('every item has English title and description', () => {
    const itemsTexts = enWhatsNew.items as Record<string, { title?: string; description?: string }>
    whatsNewItems.forEach((item) => {
      expect(itemsTexts[item.id]?.title).toBeTruthy()
      expect(itemsTexts[item.id]?.description).toBeTruthy()
    })
  })
})

describe('WhatsNew.getVisibleItems', () => {
  test('data editor sees only items for all users', () => {
    expect(ids(WhatsNew.getVisibleItems({ user: dataEditor, items }))).toEqual(['forAll'])
  })

  test('survey admin sees survey designer items too', () => {
    expect(ids(WhatsNew.getVisibleItems({ user: surveyAdmin, items }))).toEqual(['forAll', 'forSurveyAdmins'])
  })

  test('system admin sees all non-experimental items', () => {
    expect(ids(WhatsNew.getVisibleItems({ user: systemAdmin, items }))).toEqual([
      'forAll',
      'forSurveyAdmins',
      'forSystemAdmins',
    ])
  })

  test('experimental items visible only when experimental features are enabled', () => {
    expect(ids(WhatsNew.getVisibleItems({ user: dataEditor, experimentalFeatures: true, items }))).toEqual([
      'forAll',
      'experimentalForAll',
    ])
  })
})

describe('WhatsNew.getUnseenItems', () => {
  test('new user sees all visible items', () => {
    expect(ids(WhatsNew.getUnseenItems({ user: surveyAdmin, items }))).toEqual(['forAll', 'forSurveyAdmins'])
  })

  test('dismissed items are not shown again, new items are', () => {
    const userDismissed = WhatsNew.assocItemsSeen({ user: surveyAdmin, itemsSeen: items.slice(0, 2), items })
    expect(WhatsNew.getUnseenItems({ user: userDismissed, items })).toEqual([])

    const newItem: WhatsNew.WhatsNewItem = { id: 'newOne', version: '1.1.0', audience: whatsNewAudiences.all }
    const itemsUpdated = [newItem, ...items]
    expect(ids(WhatsNew.getUnseenItems({ user: userDismissed, items: itemsUpdated }))).toEqual(['newOne'])
  })

  test('experimental item becoming generally available is shown to users without experimental features', () => {
    // user without experimental features dismisses everything visible to them
    const userDismissed = WhatsNew.assocItemsSeen({
      user: dataEditor,
      itemsSeen: WhatsNew.getVisibleItems({ user: dataEditor, items }),
      items,
    })
    expect(WhatsNew.getUnseenItems({ user: userDismissed, items })).toEqual([])

    // the experimental item becomes generally available (same id, experimental flag removed)
    const itemsUpdated = items.map((item) =>
      item.id === 'experimentalForAll' ? { ...item, version: '1.2.0', experimental: false } : item
    )
    expect(ids(WhatsNew.getUnseenItems({ user: userDismissed, items: itemsUpdated }))).toEqual(['experimentalForAll'])
  })

  test('experimental item already seen with experimental features on is not shown again', () => {
    const userDismissed = WhatsNew.assocItemsSeen({
      user: dataEditor,
      itemsSeen: WhatsNew.getVisibleItems({ user: dataEditor, experimentalFeatures: true, items }),
      items,
    })
    const itemsUpdated = items.map((item) =>
      item.id === 'experimentalForAll' ? { ...item, experimental: false } : item
    )
    expect(WhatsNew.getUnseenItems({ user: userDismissed, items: itemsUpdated })).toEqual([])
  })

  test('seen ids not in the catalog anymore are pruned', () => {
    const user = User.assocPrefWhatsNewSeenIds(['removedItem'])(dataEditor)
    const userUpdated = WhatsNew.assocItemsSeen({ user, itemsSeen: [items[0]], items })
    expect(User.getPrefWhatsNewSeenIds(userUpdated)).toEqual(['forAll'])
  })

  test('at most maxAutoShownItems items are shown automatically', () => {
    const manyItems: WhatsNew.WhatsNewItem[] = Array.from({ length: WhatsNew.maxAutoShownItems + 3 }, (_, index) => ({
      id: `item${index}`,
      version: '1.0.0',
      audience: whatsNewAudiences.all,
    }))
    expect(WhatsNew.getUnseenItems({ user: dataEditor, items: manyItems })).toHaveLength(WhatsNew.maxAutoShownItems)
  })
})
