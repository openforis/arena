import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { refreshAiCapabilities } from '@webapp/ai/engines/capabilitiesStore'
import type { AiUnavailableAction } from '@webapp/ai/engines/featureAvailability'
import { appModuleUri, homeModules, userModules } from '@webapp/app/appModules'

/**
 * Returns the handler of the not-available and engine error actions.
 * @returns {Function} Runs an action: re-probe, or open the user's AI settings or the survey AI policy tab.
 */
export const useAiEngineActions = (): ((action: AiUnavailableAction | 'openSettings') => Promise<void>) => {
  const navigate = useNavigate()
  return useCallback(
    async (action: AiUnavailableAction | 'openSettings'): Promise<void> => {
      if (action === 'retry') {
        await refreshAiCapabilities()
      } else if (action === 'changePolicy') {
        navigate(appModuleUri(homeModules.surveyInfo), { state: { tab: 'aiPolicy' } })
      } else {
        // own profile: the AI settings panel (local server, provider)
        navigate(appModuleUri(userModules.user))
      }
    },
    [navigate]
  )
}
