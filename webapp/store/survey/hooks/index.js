import axios from 'axios'

import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as ObjectUtils from '@core/objectUtils'

import { useLang } from '@webapp/store/system'
import { useOnUpdate } from '@webapp/components/hooks'

import * as SurveyState from '../state'
import { SurveyStatusState } from '../status'

// ==== Survey
export const useSurveyDefsFetched = (draft) => useSelector(SurveyStatusState.areDefsFetched(draft))
export const useSurvey = () => useSelector(SurveyState.getSurvey)
export const useSurveyId = () => useSelector(SurveyState.getSurveyId)
export const useSurveyInfo = () => useSelector(SurveyState.getSurveyInfo)
export const useSurveyCycleKey = () => useSelector(SurveyState.getSurveyCycleKey)
export const useSurveyCycleKeys = () => useSelector(SurveyState.getSurveyCyclesKeys)

export const useSurveyLang = () => Survey.getLanguage(useLang())(useSurveyInfo())
export const useSurveyLangs = () => Survey.getLanguages(useSurveyInfo())

export const useOnSurveyCycleUpdate = (effect) => {
  const surveyCycleKey = useSurveyCycleKey()
  useOnUpdate(effect, [surveyCycleKey])
}

export const useNodeDefRootKeys = () => Survey.getNodeDefRootKeys(useSurvey())

// ==== Node defs
export const useNodeDefByUuid = (uuid) => Survey.getNodeDefByUuid(uuid)(useSurvey())
export const useNodeDefsByUuids = (uuids) => Survey.getNodeDefsByUuids(uuids)(useSurvey())

// ==== Categories
export const useCategoryByUuid = (uuid) => Survey.getCategoryByUuid(uuid)(useSurvey())

const useSurveyItem = ({ type }) => {
  const surveyId = useSurveyId()
  const [state, setState] = useState({
    items: [],
    itemsByUuid: {},
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get(`/api/survey/${surveyId}/${type}`, {
        params: { draft: true, validate: false },
      })
      setState({
        items: data.list,
        itemsByUuid: ObjectUtils.toUuidIndexedObj(data.list),
      })
    }
    fetchData()
  }, [surveyId])

  const getItemByUuid = useCallback((uuid) => state.itemsByUuid[uuid], [state])

  return {
    ...state,
    getItemByUuid,
  }
}

export const useSurveyCategories = () => {
  const { items: categories, getItemByUuid } = useSurveyItem({ type: 'categories' })
  return {
    categories,
    Actions: {
      getCategoryByUuid: getItemByUuid,
    },
  }
}

// ==== Taxonomies

export const useSurveyTaxonomies = () => {
  const { items: taxonomies, getItemByUuid } = useSurveyItem({ type: 'taxonomies' })
  return {
    taxonomies,
    Actions: {
      getTaxonomyByUuid: getItemByUuid,
    },
  }
}
