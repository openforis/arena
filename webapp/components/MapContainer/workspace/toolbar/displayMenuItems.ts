export type DisplayOptionKey =
  | 'showLocationMarkers'
  | 'showMarkersLabels'
  | 'showUtmGrid'
  | 'showSamplingPolygon'
  | 'showControlPoints'
  | 'showPlotReferencePoint'

export type DisplayMenuItem = { key: DisplayOptionKey; labelKey: string; checked: boolean; disabled: boolean }

export type DisplayMenuSection = { headerKey: string | null; items: DisplayMenuItem[] }

const GENERAL_KEYS: DisplayOptionKey[] = ['showLocationMarkers', 'showMarkersLabels', 'showUtmGrid']
const IMAGE_INTERPRETATION_KEYS: DisplayOptionKey[] = [
  'showSamplingPolygon',
  'showControlPoints',
  'showPlotReferencePoint',
]

/**
 * Builds the Display menu: general options, then the image interpretation options when the survey uses
 * sample-based image interpretation. Marker labels are disabled while markers are hidden.
 * @param {object} params - Parameters.
 * @param {object} params.options - Current map options (MapOptions keys to boolean).
 * @param {boolean} params.sampleBasedImageInterpretationEnabled - Whether the survey uses sample-based image interpretation.
 * @returns {DisplayMenuSection[]} The menu sections.
 */
export const getDisplayMenuSections = ({
  options,
  sampleBasedImageInterpretationEnabled,
}: {
  options: Partial<Record<DisplayOptionKey, boolean>>
  sampleBasedImageInterpretationEnabled: boolean
}): DisplayMenuSection[] => {
  const toItem = (key: DisplayOptionKey): DisplayMenuItem => ({
    key,
    labelKey: `mapWorkspace.display.${key}`,
    checked: Boolean(options[key]),
    disabled: key === 'showMarkersLabels' && !options.showLocationMarkers,
  })
  const sections: DisplayMenuSection[] = [{ headerKey: null, items: GENERAL_KEYS.map(toItem) }]
  if (sampleBasedImageInterpretationEnabled) {
    sections.push({
      headerKey: 'mapWorkspace.display.imageInterpretation',
      items: IMAGE_INTERPRETATION_KEYS.map(toItem),
    })
  }
  return sections
}
