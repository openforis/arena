import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapWorkspace } from '../MapWorkspaceContext'
import type { MapRecordCandidate, MapWorkspaceRecords } from '../mapWorkspaceTypes'
import { MAP_SHORTCUT_LABELS } from '../shortcuts/mapShortcuts'
import { formatCoordinates } from '../statusbar/coordinateFormat'
import { buildMapSearchResults } from './mapSearchQuery'
import type { MapSearchResult } from './mapSearchQuery'

// zoom reached when going to coordinates (kept when the map is already closer)
const SEARCH_MIN_ZOOM = 14
const NO_CANDIDATES: MapRecordCandidate[] = []

/**
 * Tells whether a result can be selected.
 * @param {MapSearchResult|undefined} result - The result.
 * @returns {boolean} True for coordinates and records.
 */
const isSelectable = (result: MapSearchResult | undefined): boolean =>
  result?.type === 'coordinates' || result?.type === 'record'

/**
 * Finds the next selectable result.
 * @param {MapSearchResult[]} results - The results.
 * @param {number} from - Index to start from (included).
 * @param {1|-1} step - Search direction.
 * @returns {number} The index, or -1 when there is none.
 */
const findSelectableIndex = (results: MapSearchResult[], from: number, step: 1 | -1): number => {
  for (let index = from; index >= 0 && index < results.length; index += step) {
    if (isSelectable(results[index])) return index
  }
  return -1
}

/**
 * Focuses the map search box and selects its text.
 * @param {HTMLInputElement|null} input - The search input.
 * @returns {void}
 */
export const focusMapSearch = (input: HTMLInputElement | null): void => {
  input?.focus()
  input?.select()
}

/**
 * Search box of the top bar: coordinates (decimal, DMS, UTM) and, when the map lists records, record keys.
 * Going to coordinates flies there and marks the point until the next search.
 * @param {object} props - Component props.
 * @param {MapWorkspaceRecords} [props.records] - Records on the map (none: coordinates only).
 * @returns {React.ReactElement} The combobox.
 */
export const MapSearchBox = ({ records }: { records?: MapWorkspaceRecords }): ReactElement => {
  const t = useI18nT()
  const map = useMap()
  const { searchInputRef } = useMapWorkspace()
  const listId = useId()
  const [input, setInput] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const markerRef = useRef<L.CircleMarker | null>(null)

  const candidates = records?.candidates ?? NO_CANDIDATES
  const results = useMemo(() => buildMapSearchResults({ input, candidates }), [candidates, input])

  // the active result belongs to one list of results: new results (text or records changed) start at the first one
  const [active, setActive] = useState<{ results: MapSearchResult[]; index: number } | null>(null)
  const activeIndex = active?.results === results ? active.index : findSelectableIndex(results, 0, 1)
  /**
   * Marks a result as active.
   * @param {number} index - Index of the result.
   * @returns {void}
   */
  const setActiveIndex = (index: number): void => setActive({ results, index })

  /**
   * Removes the marker of the searched place from the map.
   * @returns {void}
   */
  const removeMarker = useCallback(() => {
    markerRef.current?.remove()
    markerRef.current = null
  }, [])

  useEffect(() => removeMarker, [removeMarker])

  /**
   * Gets the text of a result.
   * @param {MapSearchResult} result - The result.
   * @returns {string} The label.
   */
  const getLabel = (result: MapSearchResult): string => {
    switch (result.type) {
      case 'coordinates':
        return t('mapWorkspace.search.goTo', { coordinates: formatCoordinates(result.lat, result.lng, 'latLon') })
      case 'invalidCoordinates':
        return t('mapWorkspace.search.invalidCoordinates')
      case 'record':
        return result.candidate.label
      case 'noMatch':
        return records ? t('mapWorkspace.search.noMatch') : t('mapWorkspace.search.coordinatesHint')
    }
  }

  /**
   * Selects a result: flies to the coordinates (marking them) or selects the record.
   * @param {MapSearchResult|undefined} result - The result.
   * @returns {void}
   */
  const select = (result: MapSearchResult | undefined): void => {
    if (!result || !isSelectable(result)) return
    removeMarker()
    if (result.type === 'coordinates') {
      const latLng = L.latLng(result.lat, result.lng)
      markerRef.current = L.circleMarker(latLng, {
        className: 'map-search-marker',
        radius: 7,
        color: '#1f5c99',
        weight: 2,
        fillColor: '#fff',
        fillOpacity: 1,
        // not a data layer: zoom to data and the layers control ignore it
        interactive: false,
      }).addTo(map)
      map.flyTo(latLng, Math.max(map.getZoom(), SEARCH_MIN_ZOOM))
    } else if (result.type === 'record') {
      records?.onSelect(result.candidate.id)
    }
    setListOpen(false)
  }

  /**
   * Handles the keyboard in the input: arrows move, Enter selects, Escape clears or leaves.
   * @param {KeyboardEvent<HTMLInputElement>} event - The key event.
   * @returns {void}
   */
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = findSelectableIndex(results, activeIndex + step, step)
        if (next >= 0) setActiveIndex(next)
        setListOpen(true)
        break
      }
      case 'Enter':
        select(results[activeIndex])
        break
      case 'Escape':
        if (input) {
          setInput('')
          removeMarker()
        } else {
          event.currentTarget.blur()
        }
        break
      default:
        return
    }
    // handled here: the workspace shortcuts (a React handler on the root, which runs after this one) skip a prevented event
    event.preventDefault()
  }

  const expanded = listOpen && results.length > 0
  /**
   * Builds the DOM id of a result option.
   * @param {number} index - Index of the result.
   * @returns {string} The id.
   */
  const optionId = (index: number): string => `${listId}-option-${index}`

  return (
    <div className="map-search">
      <span className="icon icon-search map-search__icon" aria-hidden="true" />
      <input
        ref={searchInputRef}
        type="search"
        role="combobox"
        className="map-search__input"
        aria-label={t('mapWorkspace.search.label')}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        placeholder={t(records ? 'mapWorkspace.search.placeholderFull' : 'mapWorkspace.search.placeholderCompact')}
        value={input}
        data-testid={TestId.mapWorkspace.searchInput}
        onChange={(event) => {
          setInput(event.target.value)
          setListOpen(true)
          if (!event.target.value) removeMarker()
        }}
        onFocus={() => setListOpen(true)}
        onBlur={() => setListOpen(false)}
        onKeyDown={onKeyDown}
      />
      <kbd className="map-search__kbd" aria-hidden="true">
        {MAP_SHORTCUT_LABELS.focusSearch}
      </kbd>
      <ul id={listId} role="listbox" className="map-search__results" hidden={!expanded}>
        {results.map((result, index) => {
          const selectable = isSelectable(result)
          return (
            <li
              // results are rebuilt from the text on every change: the index is their identity

              key={index}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={!selectable}
              className="map-search__result"
              data-testid={TestId.mapWorkspace.searchResult(index)}
              // keep the focus in the input
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(result)}
            >
              {getLabel(result)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
