import { Authorizer } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'

import { WhatsNewAudience, whatsNewAudiences, WhatsNewItem, whatsNewItems } from './whatsNewItems'

export { whatsNewAudiences, whatsNewItems }
export type { WhatsNewAudience, WhatsNewItem }

// maximum number of items shown automatically (e.g. to a new user who has never seen any item)
export const maxAutoShownItems = 8

// true if the user can cleanse the records of at least one survey (data cleanser or higher role)
const canCleanseSomeSurveyRecords = (user: any): boolean =>
  User.isSystemAdmin(user) ||
  User.getAuthGroups(user).some((group: any) =>
    Authorizer.canCleanseRecords(user, { uuid: AuthGroup.getSurveyUuid(group) } as any)
  )

const isVisibleToAudienceByAudience: Record<WhatsNewAudience, (user: any) => boolean> = {
  [whatsNewAudiences.all]: () => true,
  [whatsNewAudiences.dataCleanser]: canCleanseSomeSurveyRecords,
  [whatsNewAudiences.surveyAdmin]: (user) => Authorizer.canEditSomeSurvey(user),
  [whatsNewAudiences.systemAdmin]: (user) => User.isSystemAdmin(user),
}

/**
 * Returns the "What's new" items visible to the specified user.
 *
 * @param {object} params - The parameters.
 * @param {boolean} [params.experimentalFeatures=false] - Whether experimental features are enabled.
 * @param {boolean} [params.aiFeaturesEnabled=false] - Whether AI features are enabled on the server.
 * @param {WhatsNewItem[]} [params.items] - The items to filter (defaults to the whole catalog).
 */
export const getVisibleItems = ({
  user,
  experimentalFeatures = false,
  aiFeaturesEnabled = false,
  items = whatsNewItems,
}: {
  user: any
  experimentalFeatures?: boolean
  aiFeaturesEnabled?: boolean
  items?: WhatsNewItem[]
}): WhatsNewItem[] =>
  items.filter(
    (item) =>
      (experimentalFeatures || !item.experimental) &&
      (aiFeaturesEnabled || !item.aiFeatures) &&
      isVisibleToAudienceByAudience[item.audience](user)
  )

/**
 * Returns the "What's new" items visible to the specified user and not dismissed yet by the user.
 *
 * @param {object} params - The parameters.
 * @param {boolean} [params.experimentalFeatures=false] - Whether experimental features are enabled.
 * @param {boolean} [params.aiFeaturesEnabled=false] - Whether AI features are enabled on the server.
 * @param {WhatsNewItem[]} [params.items] - The items to filter (defaults to the whole catalog).
 * @returns {WhatsNewItem[]} - The unseen items (at most maxAutoShownItems).
 */
export const getUnseenItems = ({
  user,
  experimentalFeatures = false,
  aiFeaturesEnabled = false,
  items = whatsNewItems,
}: {
  user: any
  experimentalFeatures?: boolean
  aiFeaturesEnabled?: boolean
  items?: WhatsNewItem[]
}): WhatsNewItem[] => {
  const seenIds = new Set(User.getPrefWhatsNewSeenIds(user))
  return getVisibleItems({ user, experimentalFeatures, aiFeaturesEnabled, items })
    .filter((item) => !seenIds.has(item.id))
    .slice(0, maxAutoShownItems)
}

/**
 * Marks the specified items as seen in the user prefs.
 * Ids no longer in the catalog are removed, to keep the prefs small.
 *
 * @param {object} params - The parameters.
 * @param {WhatsNewItem[]} params.itemsSeen - The items to mark as seen.
 * @param {WhatsNewItem[]} [params.items] - The whole catalog.
 * @returns {object} - The updated user.
 */
export const assocItemsSeen = ({
  user,
  itemsSeen,
  items = whatsNewItems,
}: {
  user: any
  itemsSeen: WhatsNewItem[]
  items?: WhatsNewItem[]
}): any => {
  const catalogIds = new Set(items.map((item) => item.id))
  const seenIds = new Set([...User.getPrefWhatsNewSeenIds(user), ...itemsSeen.map((item) => item.id)])
  const seenIdsInCatalog = [...seenIds].filter((id) => catalogIds.has(id))
  return User.assocPrefWhatsNewSeenIds(seenIdsInCatalog)(user)
}

/**
 * Returns the i18n key of the title of the specified item.
 */
export const getTitleKey = (item: WhatsNewItem): string => `whatsNew:items.${item.id}.title`

/**
 * Returns the i18n key of the description (markdown) of the specified item.
 */
export const getDescriptionKey = (item: WhatsNewItem): string => `whatsNew:items.${item.id}.description`
