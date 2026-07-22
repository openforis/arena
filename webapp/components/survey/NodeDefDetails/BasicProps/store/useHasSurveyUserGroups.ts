import { useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

/**
 * Fetches whether the current survey has at least one user group defined.
 * The fetch only runs when `enabled` is true, to avoid an unnecessary API call
 * every time the node def editor is opened on a node def that could never show
 * the "qualifier" checkbox anyway.
 */
export const useHasSurveyUserGroups = ({ enabled }: { enabled: boolean }): boolean => {
  const surveyId = useSurveyId()
  const [hasUserGroups, setHasUserGroups] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    let ignore = false
    API.fetchUserGroups({ surveyId })
      .then((userGroups) => {
        if (!ignore) {
          setHasUserGroups(userGroups.length > 0)
        }
      })
      .catch(() => {
        if (!ignore) setHasUserGroups(false)
      })
    return () => {
      ignore = true
    }
  }, [enabled, surveyId])

  return hasUserGroups
}
