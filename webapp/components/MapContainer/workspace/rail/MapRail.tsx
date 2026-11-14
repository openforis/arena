import { useId, useRef } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import { IconButton } from '@mui/material'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapWorkspace, WorkspaceLeafletProvider } from '../MapWorkspaceContext'
import type { MapRailTab } from '../mapWorkspaceTypes'
import { RAIL_PANEL_MAX_WIDTH, RAIL_PANEL_MIN_WIDTH, useRailPanelResize } from './useRailPanelResize'

const DEFAULT_PANEL_WIDTH = 288
const KEY_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }

/**
 * Left rail: vertical tabs and their panels. Every panel stays mounted (hidden when not selected), so the
 * Leaflet layers control moved into the Layers tab is never destroyed.
 * @param {object} props - Component props.
 * @param {MapRailTab[]} props.tabs - The tabs.
 * @returns {React.ReactElement} The rail.
 */
export const MapRail = ({ tabs }: { tabs: MapRailTab[] }): ReactElement => {
  const t = useI18nT()
  const { railTab, dispatch } = useMapWorkspace()
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const panelResize = useRailPanelResize()
  // roving tab index: the selected tab (or the first one when the rail is collapsed) is the tab stop
  const tabStopIndex = Math.max(
    tabs.findIndex((tab) => tab.key === railTab),
    0
  )

  /**
   * Moves the focus between the tabs with the arrow keys.
   * @param {KeyboardEvent<HTMLDivElement>} event - The key event.
   * @returns {void}
   */
  const onTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = KEY_STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const focusedIndex = tabRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    const nextIndex = (Math.max(focusedIndex, 0) + step + tabs.length) % tabs.length
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="map-rail" data-testid={TestId.mapWorkspace.rail}>
      <div
        className="map-rail__tabs"
        role="tablist"
        tabIndex={-1}
        aria-orientation="vertical"
        aria-label={t('mapWorkspace.rail.label')}
        onKeyDown={onTabsKeyDown}
      >
        {tabs.map((tab, index) => {
          const selected = tab.key === railTab
          return (
            <button
              key={tab.key}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              tabIndex={index === tabStopIndex ? 0 : -1}
              className={classNames('map-rail__tab', { 'map-rail__tab--selected': selected })}
              data-testid={TestId.mapWorkspace.railTab(tab.key)}
              onClick={() => dispatch({ type: 'toggleRailTab', tab: tab.key })}
            >
              <span className={`icon icon-16px ${tab.iconClassName}`} aria-hidden="true" />
              <span className="map-rail__tab-label">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => {
        const width = panelResize.getWidth(tab.key, tab.width ?? DEFAULT_PANEL_WIDTH)
        return (
          <section
            key={tab.key}
            id={`${baseId}-panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab.key}`}
            hidden={tab.key !== railTab}
            className="map-rail__panel"
            style={{ width }}
            data-testid={TestId.mapWorkspace.railPanel(tab.key)}
          >
            <header className="map-rail__panel-header">
              <h2 className="map-rail__panel-title">{t(tab.titleKey ?? tab.labelKey)}</h2>
              <IconButton
                size="small"
                aria-label={t('mapWorkspace.rail.close')}
                onClick={() => dispatch({ type: 'closeRail' })}
              >
                <span className="icon icon-12px icon-arrow-left" aria-hidden="true" />
              </IconButton>
            </header>
            <div className="map-rail__panel-body">
              <WorkspaceLeafletProvider>{tab.content}</WorkspaceLeafletProvider>
            </div>
            <div // NOSONAR: a focusable separator is the accessible pattern for a resize handle
              className="map-rail__panel-resize-handle"
              role="separator"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label={t('mapWorkspace.rail.resize')}
              aria-valuenow={width}
              aria-valuemin={RAIL_PANEL_MIN_WIDTH}
              aria-valuemax={RAIL_PANEL_MAX_WIDTH}
              data-testid={TestId.mapWorkspace.railPanelResizeHandle(tab.key)}
              onPointerDown={panelResize.onPointerDown(tab.key, width)}
              onKeyDown={panelResize.onKeyDown(tab.key, width)}
            />
          </section>
        )
      })}
    </div>
  )
}
