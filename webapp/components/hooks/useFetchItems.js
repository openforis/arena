import { useState } from 'react'
import axios from 'axios'

import * as ObjectUtils from '@core/objectUtils'
import { useSurveyId } from '@webapp/store/survey'

export const useFetchItems = ({ type }) => {
  const surveyId = useSurveyId()
  const [state, setState] = useState({})

  const fetchItems = async ({ search = '' }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/${type}`, {
      params: { draft: true, validate: false, search },
    })

    return data.list
  }

  const initItems = async () => {
    const items = await fetchItems({ search: '' })
    setState(ObjectUtils.toUuidIndexedObj(items))
  }

  return {
    items: state,
    initItems,
    fetchItems,
  }
}
