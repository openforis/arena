import React, { useCallback } from 'react'
import type { ReactElement } from 'react'
import { useMap } from 'react-leaflet'

import { useNotifyWarning } from '@webapp/components/hooks'

import { useMapWorkspace } from '../MapWorkspaceContext'
import { MAP_SHORTCUT_LABELS } from '../shortcuts/mapShortcuts'
import { collectDataLatLngs } from '../tools/collectDataLatLngs'
import { exitFullScreen } from '../tools/useFullScreen'
import type { FullScreenState } from '../tools/useFullScreen'
import { computeBounds } from '../tools/zoomToData'
import { ToolbarIconButton } from './ToolbarIconButton'

const ZOOM_TO_DATA_PADDING = 32
const ZOOM_TO_DATA_MAX_ZOOM = 16

/**
 * Quick buttons of the top bar: measure distance (both bars), zoom to data and full screen (full bar).
 * @param {object} props - Component props.
 * @param {FullScreenState} props.fullScreen - Full screen state of the workspace.
 * @returns {React.ReactElement} The buttons.
 */
export const MapQuickButtons = ({ fullScreen }: { fullScreen: FullScreenState }): ReactElement => {
  const map = useMap()
  const notifyWarning = useNotifyWarning()
  const { variant, activeTool, dispatch } = useMapWorkspace()

  /**
   * Zooms the map to the data, or warns when there is none.
   * @returns {void}
   */
  const zoomToData = useCallback(() => {
    const bounds = computeBounds(collectDataLatLngs(map))
    if (!bounds) {
      // app notifications render outside the workspace: invisible in full screen
      exitFullScreen()
      notifyWarning({ key: 'mapWorkspace.quick.noDataToZoom' })
      return
    }
    map.fitBounds(
      [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ],
      { padding: [ZOOM_TO_DATA_PADDING, ZOOM_TO_DATA_PADDING], maxZoom: ZOOM_TO_DATA_MAX_ZOOM }
    )
  }, [map, notifyWarning])

  return (
    <>
      <ToolbarIconButton
        buttonKey="measureDistance"
        titleKey="mapWorkspace.tools.measureDistance"
        shortcut={MAP_SHORTCUT_LABELS.measureDistance}
        iconSrc="/img/ruler-icon-24x24.png"
        active={activeTool === 'measureDistance'}
        onClick={() => dispatch({ type: 'toggleTool', tool: 'measureDistance' })}
      />
      {variant === 'full' && (
        <>
          <ToolbarIconButton
            buttonKey="zoomToData"
            titleKey="mapWorkspace.quick.zoomToData"
            iconClassName="icon-target"
            onClick={zoomToData}
          />
          <ToolbarIconButton
            buttonKey="fullScreen"
            titleKey={fullScreen.isFullScreen ? 'mapWorkspace.quick.exitFullScreen' : 'mapWorkspace.quick.fullScreen'}
            iconClassName={fullScreen.isFullScreen ? 'icon-shrink' : 'icon-enlarge'}
            active={fullScreen.isFullScreen}
            onClick={fullScreen.toggle}
          />
        </>
      )}
    </>
  )
}
