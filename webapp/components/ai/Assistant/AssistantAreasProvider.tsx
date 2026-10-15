import React, { useState } from 'react'

import { AssistantAreasContextProvider, useComputeAssistantAreas } from './useAssistantAreas'

/**
 * Computes the status of every assistant area once and shares it with the header button, the panel host and the panel
 * (each of them computed it again before). The shared value changes only when an area's status does, so the
 * consumers don't render again every time the app does.
 * @param {object} props - Props.
 * @param {React.ReactNode} props.children - What shows or uses the assistant.
 * @returns {React.ReactElement} The children with the areas.
 */
export const AssistantAreasProvider = ({ children }: { children: React.ReactNode }) => {
  const computed = useComputeAssistantAreas()
  const [areas, setAreas] = useState(computed)
  // plain data: the same content keeps the same object (state set while rendering renders this component again)
  if (areas !== computed && JSON.stringify(areas) !== JSON.stringify(computed)) setAreas(computed)
  return <AssistantAreasContextProvider value={areas}>{children}</AssistantAreasContextProvider>
}
