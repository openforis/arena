import React, { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { Map } from '@webapp/components/Map'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'

export const MapView = () => {
  const surveyId = useSurveyId()
  const [samplingPointDataLevels, setSamplingPointDataLevels] = useState([])

  useEffect(() => {
    ;(async () => {
      const categories = await API.fetchCategories({ surveyId, draft: true })
      const samplingPointDataCategory = categories.find(
        (category) => Category.getName(category) === Survey.samplingPointDataCategoryName
      )
      setSamplingPointDataLevels(Category.getLevelsArray(samplingPointDataCategory))
    })()
  }, [])

  return (
    <Map
      layers={samplingPointDataLevels.map((level) => (
        <SamplingPointDataLayer key={CategoryLevel.getUuid(level)} levelIndex={CategoryLevel.getIndex(level)} />
      ))}
    />
  )
}
