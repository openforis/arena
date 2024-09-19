import './MapView.scss'

import React, { useCallback, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { CoordinateAttributeDataLayer } from './CoordinateAttributeDataLayer'
import { RecordEditModal } from '../common/RecordEditModal'

const getSamplingPointDataLevels = (survey) => {
  const samplingPointDataCategory = Survey.getSamplingPointDataCategory(survey)
  const samplingPointDataCoordinatesDefined =
    Category.getItemExtraDefKeys(samplingPointDataCategory).includes('location')

  return samplingPointDataCoordinatesDefined ? Category.getLevelsArray(samplingPointDataCategory) : []
}

const MapWrapper = () => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const [state, setState] = useState({
    editingRecordUuid: null,
    editingParentNodeUuid: null,
    lastRecordEditModalState: null,
  })
  const { editingRecordUuid, editingParentNodeUuid, lastRecordEditModalState } = state

  const coordinateAttributeDefs = useMemo(() => Survey.getNodeDefsArray(survey).filter(NodeDef.isCoordinate), [survey])
  const geoAttributeDefs = useMemo(() => Survey.getNodeDefsArray(survey).filter(NodeDef.isGeo), [survey])
  const samplingPointDataLevels = useMemo(() => getSamplingPointDataLevels(survey), [survey])

  const layerColors = useRandomColors(samplingPointDataLevels.length + coordinateAttributeDefs.length)

  const onRecordEditClick = useCallback((params) => {
    const { recordUuid, parentUuid } = params || {}
    setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid, editingParentNodeUuid: parentUuid }))
  }, [])

  const closeRecordEditor = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editingRecordUuid: null, editingParentNodeUuid: null }))
  }, [])

  const onRecordEditorClose = useCallback(({ modalState: lastRecordEditModalState }) => {
    setState(({ statePrev }) => ({ ...statePrev, lastRecordEditModalState }))
  }, [])

  const createRecordFromSamplingPointDataItem = useCallback(
    async ({ itemUuid, callback }) => {
      const recordUuid = await API.createRecordFromSamplingPointDataItem({ surveyId, itemUuid })
      setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid }))
      callback?.({ recordUuid })
    },
    [surveyId]
  )

  const layers = useMemo(
    () => [
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
      ...geoAttributeDefs.map((attributeDef, index) => (
        <CoordinateAttributeDataLayer
          key={NodeDef.getUuid(attributeDef)}
          attributeDef={attributeDef}
          markersColor={layerColors[samplingPointDataLevels.length + index]}
          onRecordEditClick={onRecordEditClick}
          editingRecordUuid={editingRecordUuid}
        />
      )),
    ],
    [
      coordinateAttributeDefs,
      createRecordFromSamplingPointDataItem,
      editingRecordUuid,
      geoAttributeDefs,
      layerColors,
      onRecordEditClick,
      samplingPointDataLevels,
    ]
  )

  if (samplingPointDataLevels.length + coordinateAttributeDefs.length > 0 && layerColors.length === 0) {
    // layer colors not generated yet
    return null
  }

  return (
    <>
      <Map layers={layers} />
      {editingRecordUuid && (
        <RecordEditModal
          initialState={lastRecordEditModalState}
          onClose={onRecordEditorClose}
          onRequestClose={closeRecordEditor}
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
