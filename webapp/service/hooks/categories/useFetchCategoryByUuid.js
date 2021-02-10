import { useEffect, useState } from 'react'

import * as API from '@webapp/service/api'

export const useFetchCategoryByUuid = ({ surveyId, categoryUuid }) => {
  const [category, setCategory] = useState(null)

  useEffect(() => {
    if (categoryUuid) {
      ;(async () => {
        const categoryFetched = await API.fetchCategory({ surveyId, categoryUuid })
        setCategory(categoryFetched)
      })()
    }
  }, [surveyId, categoryUuid])

  return { category }
}
