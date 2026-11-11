import { useMemo } from 'react'

import PanelRight from '@webapp/components/PanelRight'
import { useSurveyId } from '@webapp/store/survey'

import { MapContainer } from '../MapContainer'
import { MapFileLayers } from './MapFileLayers'
import { type SurveyFileRef, toSurveyMapFile } from './surveyMapFile'

type Props = {
  header: string
  onClose: () => void
  // read again when it changes: memoize it
  surveyFiles: SurveyFileRef[]
}

/**
 * Right panel with a map showing survey files (KML, KMZ, zipped Shapefile or GeoJSON).
 * @param {Props} props - The props.
 * @returns {React.ReactElement} The panel.
 */
export const SurveyFilesMapPanel = (props: Props) => {
  const { header, onClose, surveyFiles } = props

  const surveyId = useSurveyId()

  const files = useMemo(
    () => surveyFiles.map((surveyFile) => toSurveyMapFile({ surveyId, surveyFile })),
    [surveyFiles, surveyId]
  )

  return (
    <PanelRight className="map-panel" header={header} onClose={onClose} width="40vw">
      <MapContainer>
        <MapFileLayers files={files} />
      </MapContainer>
    </PanelRight>
  )
}
