import './MapWorkspace.scss'

import React, { useCallback, useMemo, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { MapWorkspaceDialogs } from './MapWorkspaceDialogs'
import { useMapWorkspace, WorkspaceLeafletProvider } from './MapWorkspaceContext'
import type { MapRailTab, MapWorkspaceRecords } from './mapWorkspaceTypes'
import { MapRail } from './rail/MapRail'
import { focusMapSearch } from './search/MapSearchBox'
import { MapStatusBar } from './statusbar/MapStatusBar'
import { MapToolbar } from './toolbar/MapToolbar'
import { MapWorkspaceTools } from './tools/MapWorkspaceTools'
import { useFullScreen } from './tools/useFullScreen'
import { useMapShortcuts } from './useMapShortcuts'
import type { MapShortcutHandlers } from './useMapShortcuts'

type MapWorkspaceProps = {
  hint?: string | null
  railTabs: MapRailTab[]
  records?: MapWorkspaceRecords
  mapElement: ReactNode
}

/**
 * Lays out a map: top bar, rail (full only), the map with the active tool, status bar, dialogs; runs the shortcuts.
 * @param {object} props - Component props.
 * @param {string|null} [props.hint] - Hint shown in the bar.
 * @param {MapRailTab[]} props.railTabs - Rail tabs (empty for compact maps).
 * @param {MapWorkspaceRecords} [props.records] - Records on the map (search and records in view).
 * @param {ReactNode} props.mapElement - The react-leaflet map.
 * @returns {React.ReactElement} The workspace.
 */
export const MapWorkspace = ({ hint = null, railTabs, records, mapElement }: MapWorkspaceProps): ReactElement => {
  const t = useI18nT()
  const { variant, dialog, dispatch, searchInputRef, setPortalContainer } = useMapWorkspace()
  const rootRef = useRef<HTMLDivElement | null>(null)

  /**
   * Stores the root element and shares it as the portal container.
   * @param {HTMLDivElement|null} element - The root element.
   * @returns {void}
   */
  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element
      setPortalContainer(element)
    },
    [setPortalContainer]
  )

  const fullScreen = useFullScreen(rootRef)

  /**
   * Focuses the search box.
   * @returns {void}
   */
  const focusSearch = useCallback(() => focusMapSearch(searchInputRef.current), [searchInputRef])

  // Part 2 adds measureArea, Part 5 adds screenshot
  const handlers = useMemo<MapShortcutHandlers>(
    () => ({
      focusSearch,
      goToCoordinates: focusSearch,
      measureDistance: () => dispatch({ type: 'toggleTool', tool: 'measureDistance' }),
      escape: () => dispatch(dialog ? { type: 'closeDialog' } : { type: 'endTool' }),
    }),
    [dialog, dispatch, focusSearch]
  )
  const onKeyDown = useMapShortcuts({ rootRef, handlers })

  return (
    <div ref={setRoot} className={classNames('map-workspace', `map-workspace--${variant}`)} onKeyDown={onKeyDown}>
      <div
        className="map-workspace__toolbar"
        role="toolbar"
        aria-label={t('mapWorkspace.toolbarLabel')}
        data-testid={TestId.mapWorkspace.toolbar}
      >
        <WorkspaceLeafletProvider>
          <MapToolbar hint={hint} fullScreen={fullScreen} records={records} />
        </WorkspaceLeafletProvider>
      </div>
      <div className="map-workspace__body">
        {variant === 'full' && railTabs.length > 0 && <MapRail tabs={railTabs} />}
        <div className="map-workspace__map">
          {mapElement}
          <WorkspaceLeafletProvider>
            <MapWorkspaceTools />
          </WorkspaceLeafletProvider>
        </div>
      </div>
      <div className="map-workspace__status" data-testid={TestId.mapWorkspace.statusBar}>
        <WorkspaceLeafletProvider>
          <MapStatusBar records={records} />
        </WorkspaceLeafletProvider>
      </div>
      <WorkspaceLeafletProvider>
        <MapWorkspaceDialogs />
      </WorkspaceLeafletProvider>
    </div>
  )
}
