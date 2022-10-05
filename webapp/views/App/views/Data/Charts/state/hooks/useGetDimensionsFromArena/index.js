import { useCallback, useEffect, useState } from 'react'

import { Query } from '@common/model/query'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import getArenaDimensions from './utils/getSelfAttributesAndAncestors'

const useGetDimensionsFromArena = (nodeDefLabelType) => {
  const survey = useSurvey()
  const language = useSurveyPreferredLang()
  const [entityDefUuid, setEntityDefUuid] = useState(null)
  const [query, setQuery] = useState([])
  const [dimensions, setDimensions] = useState([])

  const generateDimensions = useCallback(() => {
    if (entityDefUuid) {
      const _dimensions = getArenaDimensions({ nodeDefUuid: entityDefUuid, survey, language, nodeDefLabelType })
      setDimensions(_dimensions)
    }
  }, [entityDefUuid, language, survey, nodeDefLabelType])

  useEffect(() => {
    setQuery(entityDefUuid ? Query.create({ entityDefUuid }) : null)

    if (!entityDefUuid && dimensions.length > 0) {
      setDimensions([])
    } else {
      generateDimensions()
    }
  }, [dimensions.length, entityDefUuid, generateDimensions])

  useEffect(() => {
    generateDimensions()
  }, [generateDimensions])

  return { dimensions, setDimensions, entityDefUuid, setEntityDefUuid, query }
}

export default useGetDimensionsFromArena
