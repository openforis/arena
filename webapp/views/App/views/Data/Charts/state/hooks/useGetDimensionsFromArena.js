import React, { useCallback, useEffect, useState } from 'react'

import { Query } from '@common/model/query'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const _dimensions = [
  {
    label: 'LABEL',
    options: [
      {
        name: 'city_label',
        value: 'city_label',
        label: 'City',
        type: 'nominal',
        icon: NodeDefUIProps.getIconByType('integer'),
      },
      {
        name: 'inhabitants',
        value: 'inhabitants',
        label: 'Inhabitants',
        type: 'quantitative',
        icon: NodeDefUIProps.getIconByType('code'),
      },
      {
        name: 'name',
        value: 'name',
        label: 'name',
        type: 'nominal',
        icon: NodeDefUIProps.getIconByType('text'),
      },
    ],
  },
]

const useGetDimensionsFromArena = (nodeDefLabelType) => {
  const survey = useSurvey()
  const language = useSurveyPreferredLang()
  const [entityDefUuid, setEntityDefUuid] = useState(null)
  const [query, setQuery] = useState([])
  const [dimensions, setDimensions] = useState([])

  const generateDimensions = useCallback(() => {
    setDimensions(_dimensions)
  }, [entityDefUuid, language, survey, nodeDefLabelType])

  useEffect(() => {
    setQuery(entityDefUuid ? Query.create({ entityDefUuid }) : null)
    generateDimensions()
  }, [entityDefUuid])

  useEffect(() => {
    generateDimensions()
  }, [generateDimensions])

  return { dimensions, setDimensions, entityDefUuid, setEntityDefUuid, query }
}

export default useGetDimensionsFromArena
