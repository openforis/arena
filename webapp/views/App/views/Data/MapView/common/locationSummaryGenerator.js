import { DEFAULT_SRS } from '@openforis/arena-core'

import * as NumberUtils from '@core/numberUtils'

const generateSummary = ({ i18n, point, elevation }) => {
  const coordinateNumericFieldPrecision = point.srs === DEFAULT_SRS.code ? 6 : NaN
  const xFormatted = NumberUtils.roundToPrecision(point.x, coordinateNumericFieldPrecision)
  const yFormatted = NumberUtils.roundToPrecision(point.y, coordinateNumericFieldPrecision)

  return `* **${i18n.t('mapView.location')}**:
  * **X**: ${xFormatted}
  * **Y**: ${yFormatted}
  * **SRS**: ${point.srs}
* **${i18n.t('mapView.elevation')}**: ${elevation}`
}

export const LocationSummaryGenerator = {
  generateSummary,
}
