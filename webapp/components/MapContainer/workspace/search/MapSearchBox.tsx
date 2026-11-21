import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { MapRecordCandidate, MapWorkspaceRecords } from '../mapWorkspaceTypes'
import { formatCoordinates } from '@core/geo/coordinateFormat'
import { buildMapSearchResults, parseMapSearchQuery } from './mapSearchQuery'
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
 * Search box of the top bar: coordinates (decimal, DMS, UTM) and, when the map lists records, record keys.
 * Going to coordinates flies there and marks the point until the next search.
 * @param {object} props - Component props.
 * @param {MapWorkspaceRecords} [props.records] - Records on the map (none: coordinates only).
 * @returns {React.ReactElement} The combobox.
 */
export const MapSearchBox = ({ records }: { records?: MapWorkspaceRecords }): ReactElement => {
  const t = useI18nT()
  const map = useMap()
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
   * Flies to coordinates and marks them until the next search.
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   * @returns {void}
   */
  const goToCoordinates = (lat: number, lng: number): void => {
    removeMarker()
    const latLng = L.latLng(lat, lng)
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
  }

  /**
   * Selects a result: flies to the coordinates (marking them) or selects the record.
   * @param {MapSearchResult|undefined} result - The result.
   * @returns {void}
   */
  const select = (result: MapSearchResult | undefined): void => {
    if (!result || !isSelectable(result)) return
    if (result.type === 'coordinates') {
      goToCoordinates(result.lat, result.lng)
    } else if (result.type === 'record') {
      removeMarker()
      records?.onSelect(result.candidate.id)
    }
    setListOpen(false)
  }

  // each behaviour of a search request runs once per key: a records reload must not select or open again
  const searchRequest = records?.searchRequest
  const [appliedKey, setAppliedKey] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [openedKey, setOpenedKey] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  if (searchRequest && searchRequest.key !== appliedKey) {
    setAppliedKey(searchRequest.key)
    setInput(searchRequest.text)
    setListOpen(false)
  }
  if (searchRequest?.selectId && searchRequest.key !== selectedKey) {
    setSelectedKey(searchRequest.key)
  }
  // the list shows only once the requested layer is known not to match (selectId null): not before its points load
  if (
    searchRequest?.selectId === null &&
    searchRequest.key !== openedKey &&
    parseMapSearchQuery(searchRequest.text).type !== 'coordinates'
  ) {
    setOpenedKey(searchRequest.key)
    setListOpen(true)
  }
  const requestText = searchRequest?.text
  useEffect(() => {
    if (!appliedKey || requestText === undefined) return
    const query = parseMapSearchQuery(requestText)
    if (query.type === 'coordinates') goToCoordinates(query.lat, query.lng)
    else removeMarker()
    // only a new request goes to its coordinates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey])
  const requestSelectId = searchRequest?.selectId
  useEffect(() => {
    if (selectedKey && requestSelectId) records?.onSelect(requestSelectId)
    // only a new request selects; the records reloading changes onSelect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])
  // focus the input so that leaving it (a click on the map) closes the list the request opened
  useEffect(() => {
    if (openedKey) inputRef.current?.focus()
  }, [openedKey])

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
        ref={inputRef}
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
      <ul id={listId} role="listbox" className="map-search__results" hidden={!expanded}>
        {results.map((result, index) => {
          const selectable = isSelectable(result)
          return (
            <li // NOSONAR: the options are driven from the combobox input (aria-activedescendant), never focused
              key={result.type === 'record' ? result.candidate.id : result.type}
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
