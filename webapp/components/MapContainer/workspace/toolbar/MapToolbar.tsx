import React from 'react'
import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'
import type { MapWorkspaceRecords } from '../mapWorkspaceTypes'
import { MapSearchBox } from '../search/MapSearchBox'
import type { FullScreenState } from '../tools/useFullScreen'
import { AddDataMenu } from './AddDataMenu'
import { BaseMapMenu } from './BaseMapMenu'
import { DisplayMenu } from './DisplayMenu'
import { ImageryMenu } from './ImageryMenu'
import { MapQuickButtons } from './MapQuickButtons'
import { ToolsMenu } from './ToolsMenu'

/**
 * Content of the top bar. Full: Base map, Add data, Display, Imagery, Tools, quick buttons, search.
 * Compact: Base map, Display, measure distance, search (coordinates only).
 * @param {object} props - Component props.
 * @param {string|null} props.hint - Hint shown after the buttons (e.g. how to move the marker in the picker).
 * @param {FullScreenState} props.fullScreen - Full screen state of the workspace.
 * @param {MapWorkspaceRecords} [props.records] - Records on the map (record search).
 * @returns {React.ReactElement} The bar content.
 */
export const MapToolbar = ({
  hint,
  fullScreen,
  records,
}: {
  hint: string | null
  fullScreen: FullScreenState
  records?: MapWorkspaceRecords
}): ReactElement => {
  const { variant } = useMapWorkspace()
  const full = variant === 'full'
  return (
    <>
      <BaseMapMenu />
      {full && <AddDataMenu />}
      <DisplayMenu />
      {full && <ImageryMenu />}
      {full && <ToolsMenu />}
      <span className="map-toolbar__separator" aria-hidden="true" />
      <MapQuickButtons fullScreen={fullScreen} />
      {hint && (
        <span className="map-toolbar__hint" title={hint}>
          {hint}
        </span>
      )}
      <span className="map-toolbar__spacer" />
      <MapSearchBox records={records} />
    </>
  )
}
