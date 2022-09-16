const keys = {
  showControlPoints: 'showControlPoints',
  showMarkersLabels: 'showMarkersLabels',
  showLocationMarkers: 'showLocationMarkers',
  showPlotReferencePoint: 'showPlotReferencePoint',
  showSamplingPolygon: 'showSamplingPolygon',
}

const isOnlyForSampleBasedImageInterpretation = (key) =>
  [keys.showLocationMarkers, keys.showPlotReferencePoint, keys.showSamplingPolygon].includes(key)

const defaultOptions = () => ({
  [keys.showControlPoints]: true,
  [keys.showMarkersLabels]: false,
  [keys.showLocationMarkers]: true,
  [keys.showPlotReferencePoint]: true,
  [keys.showSamplingPolygon]: true,
})

export const MapOptions = {
  defaultOptions,
  keys,
  isOnlyForSampleBasedImageInterpretation,
}
