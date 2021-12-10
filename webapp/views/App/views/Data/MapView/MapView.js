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
import Record from '@webapp/components/survey/Record'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { CoordinateAttributeDataLayer } from './CoordinateAttributeDataLayer'
import { useRandomColor } from './useRandomColor'

const MapWrapper = () => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const i18n = useI18n()
  const { nextColor } = useRandomColor()

  const [state, setState] = useState({
    samplingPointDataLevels: [],
    coordinateAttributeDefs: [],
  })
  const { samplingPointDataLevels, coordinateAttributeDefs, editingRecordUuid, editingParentNodeUuid } = state

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

  const onRecordEditClick = useCallback(
    (params) => {
      const { recordUuid, parentUuid } = params || {}
      setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid, editingParentNodeUuid: parentUuid }))
    },
    [setState]
  )

  return (
    <>
      <Map
        layers={[
          ...samplingPointDataLevels.map((level) => (
            <SamplingPointDataLayer
              key={CategoryLevel.getUuid(level)}
              levelIndex={CategoryLevel.getIndex(level)}
              markersColor={nextColor()}
            />
          )),
          ...coordinateAttributeDefs.map((attributeDef) => (
            <CoordinateAttributeDataLayer
              key={NodeDef.getUuid(attributeDef)}
              attributeDef={attributeDef}
              markersColor={nextColor()}
              onRecordEditClick={onRecordEditClick}
              editingRecordUuid={editingRecordUuid}
            />
          )),
        ]}
      />
      {editingRecordUuid && (
        <PanelRight className="record-panel" header={i18n.t('mapView.editRecord')} width="70vw" onClose={() => onRecordEditClick(null)}>
          <Record recordUuid={editingRecordUuid} pageNodeUuid={editingParentNodeUuid} />
        </PanelRight>
      )}
    </>
  )
}

export const MapView = () => {
  return (
    <SurveyDefsLoader draft={false} requirePublish>
      <MapWrapper />
    </SurveyDefsLoader>
  )
}
