const keys = {
  showControlPoints: 'showControlPoints',
  showMarkersLabels: 'showMarkersLabels',
  showLocationMarkers: 'showLocationMarkers',
  showPlotReferencePoint: 'showPlotReferencePoint',
  showSamplingPolygon: 'showSamplingPolygon',
  showUtmGrid: 'showUtmGrid',
}

const createDefaultOptions = ({ sampleBasedImageInterpretationEnabled = false } = {}) => ({
  [keys.showControlPoints]: sampleBasedImageInterpretationEnabled,
  [keys.showMarkersLabels]: false,
  [keys.showLocationMarkers]: true,
  [keys.showPlotReferencePoint]: sampleBasedImageInterpretationEnabled,
  [keys.showSamplingPolygon]: sampleBasedImageInterpretationEnabled,
  [keys.showUtmGrid]: false,
})

const assocOption =
  ({ option, value }) =>
  (options) => {
    const optionsUpdated = { ...options, [option]: value }
    if (option === keys.showLocationMarkers && !value) {
      // when location markers are hidden, hide even markers' labels
      optionsUpdated[keys.showMarkersLabels] = false
    }
    return optionsUpdated
  }

export const MapOptions = {
  keys,
  // create
  createDefaultOptions,
  // update
  assocOption,
}
