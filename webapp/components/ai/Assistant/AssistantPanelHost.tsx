import React, { Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { isAnalysisRoute } from './analysis/analysisArea'
import { isAssistantShown, pickArea } from './assistantAreas'
import { assistantPanelStore } from './assistantPanelStore'
import { useAssistantAreas } from './useAssistantAreas'
import { useAssistantPanel } from './useAssistantPanel'

// the panel, the agent and the AI SDK load on the first open
const AssistantPanel = React.lazy(() => import('./AssistantPanel'))

/**
 * Keeps the selected area valid and mounts the panel after the first open (it stays mounted, so closing the panel
 * doesn't stop a running answer).
 * @returns {React.ReactElement|null} The panel.
 */
export const AssistantPanelHost = () => {
  const { statuses, module } = useAssistantAreas()
  const { open, area, userSelectedArea } = useAssistantPanel()
  const [mounted, setMounted] = useState(open)
  const shown = isAssistantShown(statuses)
  const { pathname } = useLocation()

  // mounted on the first open, then kept
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (!shown && open) assistantPanelStore.close()
  }, [open, shown])

  useEffect(() => {
    const next = pickArea({
      statuses,
      current: area,
      panelOpen: open,
      userSelectedArea,
      module,
      analysisRoute: isAnalysisRoute(pathname),
    })
    if (next !== area) assistantPanelStore.setArea(next)
  }, [area, module, open, pathname, statuses, userSelectedArea])

  if (!mounted || !shown) return null

  return (
    <Suspense fallback={null}>
      <AssistantPanel statuses={statuses} />
    </Suspense>
  )
}
