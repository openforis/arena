import * as Authorizer from '@core/auth/authorizer'
import * as User from '@core/user/user'

import { WhatsNewAudience, WhatsNewItem, whatsNewAudiences, whatsNewItems } from './whatsNewItems'

export { whatsNewAudiences, whatsNewItems }
export type { WhatsNewAudience, WhatsNewItem }

// maximum number of items shown automatically (e.g. to a new user who has never seen any item)
export const maxAutoShownItems = 8

const isVisibleToAudienceByAudience: Record<WhatsNewAudience, (user: any) => boolean> = {
  [whatsNewAudiences.all]: () => true,
  [whatsNewAudiences.surveyAdmin]: (user) => Authorizer.canEditSomeSurvey(user),
  [whatsNewAudiences.systemAdmin]: (user) => User.isSystemAdmin(user),
}

/**
 * Returns the "What's new" items visible to the specified user.
 *
 * @param {object} params - The parameters.
 * @param {object} params.user - The user.
 * @param {boolean} [params.experimentalFeatures=false] - Whether experimental features are enabled.
 * @param {WhatsNewItem[]} [params.items] - The items to filter (defaults to the whole catalog).
 * @returns {WhatsNewItem[]} - The visible items.
 */
export const getVisibleItems = ({
  user,
  experimentalFeatures = false,
  items = whatsNewItems,
}: {
  user: any
  experimentalFeatures?: boolean
  items?: WhatsNewItem[]
}): WhatsNewItem[] =>
  items.filter(
    (item) => (experimentalFeatures || !item.experimental) && isVisibleToAudienceByAudience[item.audience](user)
  )

/**
 * Returns the "What's new" items visible to the specified user and not dismissed yet by the user.
 *
 * @param {object} params - The parameters.
 * @param {object} params.user - The user.
 * @param {boolean} [params.experimentalFeatures=false] - Whether experimental features are enabled.
 * @param {WhatsNewItem[]} [params.items] - The items to filter (defaults to the whole catalog).
 * @returns {WhatsNewItem[]} - The unseen items (at most maxAutoShownItems).
 */
export const getUnseenItems = ({
  user,
  experimentalFeatures = false,
  items = whatsNewItems,
}: {
  user: any
  experimentalFeatures?: boolean
  items?: WhatsNewItem[]
}): WhatsNewItem[] => {
  const seenIds = new Set(User.getPrefWhatsNewSeenIds(user))
  return getVisibleItems({ user, experimentalFeatures, items })
    .filter((item) => !seenIds.has(item.id))
    .slice(0, maxAutoShownItems)
}

/**
 * Marks the specified items as seen in the user prefs.
 * Ids no longer in the catalog are removed, to keep the prefs small.
 *
 * @param {object} params - The parameters.
 * @param {object} params.user - The user.
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
 *
 * @param {WhatsNewItem} item - The item.
 * @returns {string} - The i18n key.
 */
export const getTitleKey = (item: WhatsNewItem): string => `whatsNew:items.${item.id}.title`

/**
 * Returns the i18n key of the description (markdown) of the specified item.
 *
 * @param {WhatsNewItem} item - The item.
 * @returns {string} - The i18n key.
 */
export const getDescriptionKey = (item: WhatsNewItem): string => `whatsNew:items.${item.id}.description`
