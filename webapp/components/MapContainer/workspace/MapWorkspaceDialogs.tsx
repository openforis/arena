import React from 'react'
import type { ComponentType, ReactElement } from 'react'

import { useMapWorkspace } from './MapWorkspaceContext'
import type { MapDialogKey } from './mapWorkspaceTypes'

// Part 3 adds `wms`, Part 5 adds `screenshot`; a dialog closes itself with dispatch({ type: 'closeDialog' })
const dialogComponents: Partial<Record<MapDialogKey, ComponentType>> = {}

/**
 * Renders the open workspace dialog, if any.
 * @returns {React.ReactElement|null} The dialog.
 */
export const MapWorkspaceDialogs = (): ReactElement | null => {
  const { dialog } = useMapWorkspace()
  const DialogComponent = dialog ? dialogComponents[dialog] : undefined
  return DialogComponent ? <DialogComponent /> : null
}
