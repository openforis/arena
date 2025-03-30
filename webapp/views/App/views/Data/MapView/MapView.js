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

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { RecordEditModal } from '../common/RecordEditModal'
import { GeoAttributeDataLayer } from './GeoAttributeDataLayer'

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

  const geoAttributeDefs = useMemo(
    () => Survey.getNodeDefsArray(survey).filter((nodeDef) => NodeDef.isGeo(nodeDef) || NodeDef.isCoordinate(nodeDef)),
    [survey]
  )
  const samplingPointDataLevels = useMemo(() => getSamplingPointDataLevels(survey), [survey])

  const layerColors = useRandomColors(samplingPointDataLevels.length + geoAttributeDefs.length)

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
      ...geoAttributeDefs.map((attributeDef, index) => (
        <GeoAttributeDataLayer
          key={NodeDef.getUuid(attributeDef)}
          attributeDef={attributeDef}
          markersColor={layerColors[samplingPointDataLevels.length + index]}
          onRecordEditClick={onRecordEditClick}
          editingRecordUuid={editingRecordUuid}
        />
      )),
    ],
    [
      createRecordFromSamplingPointDataItem,
      editingRecordUuid,
      geoAttributeDefs,
      layerColors,
      onRecordEditClick,
      samplingPointDataLevels,
    ]
  )

  if (layers.length > 0 && layerColors.length === 0) {
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

export const MapView = () => <MapWrapper />
