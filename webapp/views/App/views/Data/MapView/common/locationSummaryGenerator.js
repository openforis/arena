import { DEFAULT_SRS, Numbers } from '@openforis/arena-core'

const generateSummary = ({ i18n, point, elevation }) => {
  const coordinateNumericFieldPrecision = point.srs === DEFAULT_SRS.code ? 6 : NaN
  const xFormatted = Numbers.roundToPrecision(point.x, coordinateNumericFieldPrecision)
  const yFormatted = Numbers.roundToPrecision(point.y, coordinateNumericFieldPrecision)

  return `* **${i18n.t('mapView.location')}**:
  * **X**: ${xFormatted}
  * **Y**: ${yFormatted}
  * **SRS**: ${point.srs}
* **${i18n.t('mapView.elevation')}**: ${elevation}`
}

export const LocationSummaryGenerator = {
  generateSummary,
}
