import './MapView.scss'

import React, { useCallback, useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { PanelRight } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { CoordinateAttributeDataLayer } from './CoordinateAttributeDataLayer'
import { useRandomColors } from './useRandomColor'

const MapWrapper = () => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const i18n = useI18n()

  const [state, setState] = useState({
    samplingPointDataLevels: [],
    coordinateAttributeDefs: [],
  })
  const { samplingPointDataLevels, coordinateAttributeDefs, editingRecordUuid, editingParentNodeUuid } = state

  const layerColors = useRandomColors(samplingPointDataLevels.length + coordinateAttributeDefs.length)

  useEffect(() => {
    ;(async () => {
      // get sampling point data levels
      const categories = await API.fetchCategories({ surveyId, draft: true })
      const samplingPointDataCategory = categories.find(
        (category) => Category.getName(category) === Survey.samplingPointDataCategoryName
      )
      // get coordinate attributes
      const coordinateAttributeDefs = Survey.getNodeDefsArray(survey).filter(NodeDef.isCoordinate)

      setState((statePrev) => ({
        ...statePrev,
        samplingPointDataLevels: Category.getLevelsArray(samplingPointDataCategory),
        coordinateAttributeDefs,
      }))
    })()
  }, [])

  const onRecordEditClick = useCallback((params) => {
    const { recordUuid, parentUuid } = params || {}
    setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid, editingParentNodeUuid: parentUuid }))
  }, [])

  const closeRecordEditor = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editingRecordUuid: null, editingParentNodeUuid: null }))
  }, [])

  const createRecordFromSamplingPointDataItem = useCallback(
    async ({ itemUuid, callback }) => {
      const recordUuid = await API.createRecordFromSamplingPointDataItem({ surveyId, itemUuid })
      setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid }))
      callback?.({ recordUuid })
    },
    [surveyId]
  )

  if (samplingPointDataLevels.length + coordinateAttributeDefs.length > 0 && layerColors.length === 0) {
    // layer colors not generated yet
    return null
  }

  return (
    <>
      <Map
        layers={[
          ...samplingPointDataLevels.map((level, index) => (
            <SamplingPointDataLayer
              key={CategoryLevel.getUuid(level)}
              levelIndex={CategoryLevel.getIndex(level)}
              markersColor={layerColors[index]}
              onRecordEditClick={onRecordEditClick}
              createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
            />
          )),
          ...coordinateAttributeDefs.map((attributeDef, index) => (
            <CoordinateAttributeDataLayer
              key={NodeDef.getUuid(attributeDef)}
              attributeDef={attributeDef}
              markersColor={layerColors[samplingPointDataLevels.length + index]}
              onRecordEditClick={onRecordEditClick}
              editingRecordUuid={editingRecordUuid}
            />
          )),
        ]}
      />
      {editingRecordUuid && (
        <PanelRight
          className="record-panel"
          header={i18n.t('mapView.editRecord')}
          width="70vw"
          onClose={closeRecordEditor}
        >
          <RecordEditor recordUuid={editingRecordUuid} pageNodeUuid={editingParentNodeUuid} insideMap />
        </PanelRight>
      )}
    </>
  )
}

export const MapView = () => (
  <SurveyDefsLoader draft={false} requirePublish>
    <MapWrapper />
  </SurveyDefsLoader>
)
