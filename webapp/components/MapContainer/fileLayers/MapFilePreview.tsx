import './MapFilePreview.scss'

import { useMemo } from 'react'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import { MapContainer } from '../MapContainer'
import { type MapFile, MapFileLayers } from './MapFileLayers'
import { type SurveyFileRef, toSurveyMapFile } from './surveyMapFile'

type Props = {
  // a file not uploaded yet (e.g. dropped in a dialog): shown instead of the survey file
  file?: File | null
  // memoize it: downloaded again when it changes
  surveyFile?: SurveyFileRef | null
}

/**
 * Small map previewing a file (KML, KMZ, zipped Shapefile or GeoJSON); nothing without a file or map access.
 * @param {Props} props - The props.
 * @returns {React.ReactElement|null} The map.
 */
export const MapFilePreview = (props: Props) => {
  const { file = null, surveyFile = null } = props

  const surveyId = useSurveyId()
  const canUseMap = useAuthCanUseMap()

  const files = useMemo((): MapFile[] => {
    if (file) return [{ getFile: () => Promise.resolve(file) }]
    if (surveyFile) return [toSurveyMapFile({ surveyId, surveyFile })]
    return []
  }, [file, surveyFile, surveyId])

  if (!canUseMap || files.length === 0) return null

  return (
    <div className="map-file-preview">
      <MapContainer>
        <MapFileLayers files={files} />
      </MapContainer>
    </div>
  )
}
