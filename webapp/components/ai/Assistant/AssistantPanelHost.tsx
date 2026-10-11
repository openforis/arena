import React, { Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import * as User from '@core/user/user'

import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { isAnalysisRoute } from './analysis/analysisArea'
import { isCleaningRoute } from './cleaning/cleaningArea'
import { useExplorerEditMode } from './cleaning/useCleaningArea'
import { isAssistantShown, pickArea } from './assistantAreas'
import { assistantPanelStore } from './assistantPanelStore'
import { useAssistantAreas } from './useAssistantAreas'
import { useAssistantPanel } from './useAssistantPanel'
import { SuggestionsHost } from './suggestions/SuggestionsHost'

// the panel, the agent and the AI SDK load on the first open
const AssistantPanel = React.lazy(() => import('./AssistantPanel'))

/**
 * Keeps the selected area valid, always mounts the suggestions host, and mounts the panel after the first open (it
 * stays mounted, so closing the panel doesn't stop a running answer).
 * @returns {React.ReactElement} The host and the panel.
 */
export const AssistantPanelHost = () => {
  const { statuses, module } = useAssistantAreas()
  const { open, area, userSelectedArea } = useAssistantPanel()
  const [mounted, setMounted] = useState(open)
  const shown = isAssistantShown(statuses)
  const { pathname } = useLocation()
  const explorerEditMode = useExplorerEditMode()
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const surveyId: number | null = useSurveyId() ?? null

  // mounted on the first open, then kept
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (!shown && open) assistantPanelStore.close()
  }, [open, shown])

  // the open conversation of each area is remembered per user and survey
  useEffect(() => {
    assistantPanelStore.setScope(userUuid ? { userUuid, surveyId } : null)
  }, [surveyId, userUuid])

  useEffect(() => {
    const next = pickArea({
      statuses,
      current: area,
      panelOpen: open,
      userSelectedArea,
      module,
      analysisRoute: isAnalysisRoute(pathname),
      cleaningRoute: isCleaningRoute({ pathname, explorerEditMode }),
    })
    if (next !== area) assistantPanelStore.setArea(next)
  }, [area, explorerEditMode, module, open, pathname, statuses, userSelectedArea])

  return (
    <>
      <SuggestionsHost module={module} statuses={statuses} />
      {mounted && shown && (
        <Suspense fallback={null}>
          <AssistantPanel statuses={statuses} />
        </Suspense>
      )}
    </>
  )
}
