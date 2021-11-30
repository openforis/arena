import React, { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'

import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import {CoordinateAttributeDataLayer} from './CoordinateAttributeDataLayer'
import { useRandomColor } from './useRandomColor'

const MapWrapper = () => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)
  const [state, setState] = useState({
    samplingPointDataLevels:[], 
    coordinateAttributeDefs: [],
  })
  const { nextColor } = useRandomColor()

  const { samplingPointDataLevels, coordinateAttributeDefs} = state

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

  return (
    <Map
      layers={[...samplingPointDataLevels.map((level) => (
        <SamplingPointDataLayer
          key={CategoryLevel.getUuid(level)}
          levelIndex={CategoryLevel.getIndex(level)}
          markersColor={nextColor()}
        />
      )), ...coordinateAttributeDefs.map(attributeDef=> (
        <CoordinateAttributeDataLayer attributeDef={attributeDef} />
      )]}
    />
  )
}

export const MapView = () => {
  return (
    <SurveyDefsLoader>
      <MapWrapper />
    </SurveyDefsLoader>
  )
}
