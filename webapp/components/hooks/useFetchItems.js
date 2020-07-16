import { useState } from 'react'
import axios from 'axios'

import * as ObjectUtils from '@core/objectUtils'
import { useSurveyId } from '@webapp/store/survey'

export const useFetchItems = ({ type }) => {
  const surveyId = useSurveyId()
  const [items, setItems] = useState({})

  const fetchItems = async ({ search = '', draft = true, validate = false }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/${type}`, {
      params: { draft, validate, search },
    })

    return data.list
  }

  const initItems = async (params = {}) => {
    const { draft = true, validate = false } = params
    const itemsFetched = await fetchItems({ search: '', draft, validate })
    setItems(ObjectUtils.toUuidIndexedObj(itemsFetched))
  }

  return {
    items,
    initItems,
    fetchItems,
  }
}
