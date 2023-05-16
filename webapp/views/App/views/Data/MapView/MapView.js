import './MapView.scss'

import React, { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'

import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { CoordinateAttributeDataLayer } from './CoordinateAttributeDataLayer'
import { useRandomColors } from './useRandomColor'
import { RecordEditModal } from './RecordEditModal'

const MapWrapper = () => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const [state, setState] = useState({
    editingRecordUuid: null,
    editingParentNodeUuid: null,
  })
  const { editingRecordUuid, editingParentNodeUuid } = state

  // get sampling point data levels
  const categories = Survey.getCategoriesArray(survey)
  const samplingPointDataCategory = categories.find(
    (category) => Category.getName(category) === Survey.samplingPointDataCategoryName
  )
  // get coordinate attributes
  const coordinateAttributeDefs = Survey.getNodeDefsArray(survey).filter(NodeDef.isCoordinate)
  const samplingPointDataLevels = Category.getLevelsArray(samplingPointDataCategory)

  const layerColors = useRandomColors(samplingPointDataLevels.length + coordinateAttributeDefs.length)

  const onRecordEditClick = useCallback(({ recordUuid, parentUuid } = {}) => {
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
        <RecordEditModal
          onClose={closeRecordEditor}
          recordUuid={editingRecordUuid}
          parentNodeUuid={editingParentNodeUuid}
        />
      )}
    </>
  )
}

export const MapView = () => (
  <SurveyDefsLoader draft={false} requirePublish>
    <MapWrapper />
  </SurveyDefsLoader>
)
