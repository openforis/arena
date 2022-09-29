const keys = {
  showControlPoints: 'showControlPoints',
  showMarkersLabels: 'showMarkersLabels',
  showLocationMarkers: 'showLocationMarkers',
  showPlotReferencePoint: 'showPlotReferencePoint',
  showSamplingPolygon: 'showSamplingPolygon',
}

const isOnlyForSampleBasedImageInterpretation = (key) =>
  [keys.showControlPoints, keys.showLocationMarkers, keys.showPlotReferencePoint, keys.showSamplingPolygon].includes(
    key
  )

const createDefaultOptions = ({ sampleBasedImageInterpretationEnabled = false } = {}) => ({
  [keys.showControlPoints]: sampleBasedImageInterpretationEnabled,
  [keys.showMarkersLabels]: false,
  [keys.showLocationMarkers]: true,
  [keys.showPlotReferencePoint]: sampleBasedImageInterpretationEnabled,
  [keys.showSamplingPolygon]: sampleBasedImageInterpretationEnabled,
})

export const MapOptions = {
  createDefaultOptions,
  keys,
  isOnlyForSampleBasedImageInterpretation,
}
