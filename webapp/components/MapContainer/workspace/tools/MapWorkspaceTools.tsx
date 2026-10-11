import type { ReactElement } from 'react'

import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { MeasureTool } from '@webapp/components/MapContainer/workspace/tools/measure/MeasureTool'
import { measureModeOfTool } from '@webapp/components/MapContainer/workspace/tools/measure/measureModes'

/**
 * Renders the active map tool; it is inside WorkspaceLeafletProvider, so tools can use the Leaflet map.
 * One MeasureTool serves both measure tools, so switching Distance <-> Area keeps it mounted (and the chosen units).
 * @returns {React.ReactElement|null} The active tool, or null when no tool is active.
 */
export const MapWorkspaceTools = (): ReactElement | null => {
  const { activeTool } = useMapWorkspace()
  const measureMode = measureModeOfTool(activeTool)
  return measureMode ? <MeasureTool mode={measureMode} /> : null
}
