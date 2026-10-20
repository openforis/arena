import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import * as WhatsNew from '@core/whatsNew/whatsNew'

import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'

/**
 * Returns all the "What's new" items visible to the current user.
 *
 * @returns {WhatsNew.WhatsNewItem[]} - The visible items.
 */
export const useWhatsNewVisibleItems = (): WhatsNew.WhatsNewItem[] => {
  const user = useUser()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  return useMemo(() => WhatsNew.getVisibleItems({ user, experimentalFeatures }), [experimentalFeatures, user])
}

/**
 * Returns the "What's new" items not dismissed yet by the current user and a function to dismiss them.
 *
 * @returns {{unseenItems: WhatsNew.WhatsNewItem[], markItemsAsSeen: Function}} - The unseen items and the function to mark them as seen.
 */
export const useWhatsNewUnseenItems = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()

  const unseenItems = useMemo(
    () => (user ? WhatsNew.getUnseenItems({ user, experimentalFeatures }) : []),
    [experimentalFeatures, user]
  )

  const markItemsAsSeen = useCallback(
    (itemsSeen: WhatsNew.WhatsNewItem[]) => {
      const userUpdated = WhatsNew.assocItemsSeen({ user, itemsSeen })
      dispatch(UserActions.updateUserPrefs({ user: userUpdated }) as any)
    },
    [dispatch, user]
  )

  return { unseenItems, markItemsAsSeen }
}
