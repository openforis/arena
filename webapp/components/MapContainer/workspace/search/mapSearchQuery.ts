import { parseMapSearchQuery } from '@core/geo/coordinateQuery'

import type { MapRecordCandidate } from '../mapWorkspaceTypes'

export { parseMapSearchQuery }
export type { MapSearchQuery } from '@core/geo/coordinateQuery'

export type MapSearchResult =
  | { type: 'coordinates'; lat: number; lng: number }
  | { type: 'invalidCoordinates' }
  | { type: 'record'; candidate: MapRecordCandidate }
  | { type: 'noMatch' }

export const MAP_SEARCH_MAX_RECORDS = 8

/**
 * Ranks how well a label matches the text.
 * @param {string} label - Lowercase label.
 * @param {string} text - Lowercase text.
 * @returns {number} 0 exact, 1 prefix, 2 substring, -1 no match.
 */
const getMatchRank = (label: string, text: string): number => {
  if (label === text) return 0
  if (label.startsWith(text)) return 1
  return label.includes(text) ? 2 : -1
}

/**
 * Finds the records whose label matches the text: exact matches first, then prefixes, then substrings.
 * @param {MapRecordCandidate[]} candidates - Records shown on the map.
 * @param {string} text - Text to look for (case-insensitive).
 * @param {number} [limit] - Maximum number of results.
 * @returns {MapRecordCandidate[]} The matching records.
 */
export const findRecordCandidates = (
  candidates: MapRecordCandidate[],
  text: string,
  limit = MAP_SEARCH_MAX_RECORDS
): MapRecordCandidate[] => {
  const query = text.trim().toLocaleLowerCase()
  if (!query) return []
  const ranked: Array<{ candidate: MapRecordCandidate; rank: number }> = []
  for (const candidate of candidates) {
    const rank = getMatchRank(candidate.label.toLocaleLowerCase(), query)
    if (rank >= 0) ranked.push({ candidate, rank })
  }
  ranked.sort(
    (a, b) => a.rank - b.rank || a.candidate.label.localeCompare(b.candidate.label, undefined, { numeric: true })
  )
  return ranked.slice(0, limit).map(({ candidate }) => candidate)
}

/**
 * Finds the one record whose whole label, or last key (last ' - ' part), equals the text.
 * @param {MapRecordCandidate[]} candidates - Records shown on the map.
 * @param {string} text - Text to look for (case-insensitive).
 * @returns {MapRecordCandidate|null} The record, or null when none or several match.
 */
export const findSingleRecordMatch = (candidates: MapRecordCandidate[], text: string): MapRecordCandidate | null => {
  const query = text.trim().toLocaleLowerCase()
  if (!query) return null
  const matches = candidates.filter((candidate) => {
    const label = candidate.label.trim().toLocaleLowerCase()
    return label === query || label.split(' - ').at(-1) === query
  })
  return matches.length === 1 ? matches[0] : null
}

/**
 * Finds the record to go to for a search asked from outside: none when the text is coordinates (they win).
 * @param {MapRecordCandidate[]} candidates - Records shown on the map.
 * @param {string} text - The searched text.
 * @returns {string|null} The record id, or null.
 */
export const findSearchSelectId = (candidates: MapRecordCandidate[], text: string): string | null =>
  parseMapSearchQuery(text).type === 'coordinates' ? null : (findSingleRecordMatch(candidates, text)?.id ?? null)

/**
 * Builds the search results: the coordinates (or the invalid coordinates notice) first, then the matching records.
 * @param {object} params - Parameters.
 * @param {string} params.input - The search box text.
 * @param {MapRecordCandidate[]} params.candidates - Records shown on the map (empty when the Records list is not available).
 * @returns {MapSearchResult[]} The results; [] for an empty input, [{type: 'noMatch'}] when nothing matches.
 */
export const buildMapSearchResults = ({
  input,
  candidates,
}: {
  input: string
  candidates: MapRecordCandidate[]
}): MapSearchResult[] => {
  const query = parseMapSearchQuery(input)
  if (query.type === 'empty') return []
  const results: MapSearchResult[] = []
  if (query.type === 'coordinates' || query.type === 'invalidCoordinates') results.push(query)
  for (const candidate of findRecordCandidates(candidates, input)) {
    results.push({ type: 'record', candidate })
  }
  return results.length > 0 ? results : [{ type: 'noMatch' }]
}
