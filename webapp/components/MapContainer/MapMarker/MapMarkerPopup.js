import { Popup } from 'react-leaflet'

import Markdown from '@webapp/components/markdown'
import { useI18n } from '@webapp/store/system'
import { LocationSummaryGenerator } from '@webapp/views/App/views/Data/MapView/common/locationSummaryGenerator'

export const MapMarkerPopup = (props) => {
  const { point, title, elevation } = props

  const i18n = useI18n()

  const description = point
    ? `**${title}**
${LocationSummaryGenerator.generateSummary({ i18n, point, elevation })}`
    : null

  return (
    <Popup>
      <Markdown source={description} />
    </Popup>
  )
}
