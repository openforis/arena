import React from 'react'

import { AssistantAreasContextProvider, useComputeAssistantAreas } from './useAssistantAreas'

/**
 * Computes the status of every assistant area once and shares it with the header button, the panel host and the panel
 * (each of them computed it again before).
 * @param {object} props - Props.
 * @param {React.ReactNode} props.children - What shows or uses the assistant.
 * @returns {React.ReactElement} The children with the areas.
 */
export const AssistantAreasProvider = ({ children }: { children: React.ReactNode }) => (
  <AssistantAreasContextProvider value={useComputeAssistantAreas()}>{children}</AssistantAreasContextProvider>
)
