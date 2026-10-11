import React from 'react'
import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'
import { RulerBridge } from './RulerBridge'

/**
 * Renders the active map tool (Part 2 replaces the ruler with the measure tool).
 * @returns {React.ReactElement|null} The tool.
 */
export const MapWorkspaceTools = (): ReactElement | null => {
  const { activeTool } = useMapWorkspace()
  if (activeTool === 'measureDistance') return <RulerBridge />
  return null
}
