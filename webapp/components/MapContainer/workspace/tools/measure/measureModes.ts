import type { MapToolKey } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'
import type {
  GeomanShape,
  MeasureDrawOptions,
  MeasureMode,
  MeasureUnitOption,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

// visible on both imagery and street base maps
export const MEASURE_COLOR = '#ff6d00'

const MODE_BY_TOOL: Partial<Record<MapToolKey, MeasureMode>> = { measureDistance: 'distance', measureArea: 'area' }
const TOOL_BY_MODE: Record<MeasureMode, MapToolKey> = { distance: 'measureDistance', area: 'measureArea' }
const SHAPE_BY_MODE: Record<MeasureMode, GeomanShape> = { distance: 'Line', area: 'Polygon' }
const UNIT_OPTIONS_BY_MODE: Record<MeasureMode, MeasureUnitOption[]> = {
  distance: ['auto', 'm', 'km'],
  area: ['auto', 'm2', 'ha', 'km2'],
}

/**
 * Returns the measure mode of a workspace tool.
 * @param {MapToolKey|null} tool - The active workspace tool.
 * @returns {MeasureMode|null} The mode, or null when the tool is not a measure tool.
 */
export const measureModeOfTool = (tool: MapToolKey | null): MeasureMode | null =>
  tool ? (MODE_BY_TOOL[tool] ?? null) : null

/**
 * Returns the workspace tool of a measure mode.
 * @param {MeasureMode} mode - The mode.
 * @returns {MapToolKey} The tool key.
 */
export const toolOfMeasureMode = (mode: MeasureMode): MapToolKey => TOOL_BY_MODE[mode]

/**
 * Returns the Geoman shape drawn in a mode.
 * @param {MeasureMode} mode - The mode.
 * @returns {GeomanShape} 'Line' for distance, 'Polygon' for area.
 */
export const geomanShapeOf = (mode: MeasureMode): GeomanShape => SHAPE_BY_MODE[mode]

/**
 * Returns the unit choices of a mode.
 * @param {MeasureMode} mode - The mode.
 * @returns {MeasureUnitOption[]} The units, 'auto' first.
 */
export const unitOptionsOf = (mode: MeasureMode): MeasureUnitOption[] => [...UNIT_OPTIONS_BY_MODE[mode]]

/**
 * Returns the Geoman draw options of a mode.
 * @param {MeasureMode} mode - The mode.
 * @returns {MeasureDrawOptions} The options passed to map.pm.enableDraw.
 */
export const measureDrawOptions = (mode: MeasureMode): MeasureDrawOptions => ({
  // snapping to the survey markers would pull vertices onto them and is slow with many markers
  snappable: false,
  // the measure bar shows the instructions in the user's language
  tooltips: false,
  continueDrawing: true,
  finishOn: null,
  // a crossing polygon has no meaningful area: Geoman refuses the crossing vertex
  allowSelfIntersection: mode !== 'area',
  templineStyle: { color: MEASURE_COLOR, weight: 3 },
  hintlineStyle: { color: MEASURE_COLOR, weight: 2, dashArray: '6,6' },
  pathOptions: { color: MEASURE_COLOR, weight: 3, fillColor: MEASURE_COLOR, fillOpacity: 0.15, interactive: false },
})
