import { useEffect, useSyncExternalStore } from 'react'

import * as User from '@core/user/user'

import {
  getAiCapabilitiesSnapshot,
  loadAiCapabilities,
  resetAiCapabilities,
  subscribeAiCapabilities,
} from '@webapp/ai/engines/capabilitiesStore'
import type { AiCapabilities } from '@webapp/ai/engines/types'
import { useSystemConfigAiFeaturesEnabled } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

/**
 * Returns what this browser can use for AI (gateway, local server, instance limits), loading it once per session.
 * @returns {AiCapabilities} The capabilities (nothing available until loaded).
 */
export const useAiCapabilities = (): AiCapabilities => {
  const aiEnabledInSystem = useSystemConfigAiFeaturesEnabled()
  const user = useUser()
  const userUuid = user ? (User.getUuid(user) ?? null) : null
  const capabilities = useSyncExternalStore(subscribeAiCapabilities, getAiCapabilitiesSnapshot)

  useEffect(() => {
    if (aiEnabledInSystem && userUuid) loadAiCapabilities().catch(() => undefined)
    else if (!userUuid) resetAiCapabilities()
  }, [aiEnabledInSystem, userUuid])

  return capabilities
}
