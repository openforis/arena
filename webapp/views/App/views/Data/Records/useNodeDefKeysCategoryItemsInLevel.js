import { useEffect, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'

export const useNodeDefKeysCategoryItemsInLevel = () => {
  const survey = useSurvey()
  const [result, setResult] = useState(null)

  useEffect(() => {
    const categoryItemsByCodeDefUuid = {}
    const requestCancelByNodeDefUuid = {}

    const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
    const surveyId = Survey.getId(survey)

    const nodeDefCodeKeys = nodeDefKeys.filter(NodeDef.isCode)
    if (nodeDefCodeKeys.length === 0) {
      setResult({})
      return
    }
    nodeDefCodeKeys.forEach((nodeDefKey) => {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDefKey)
      if (!categoryUuid) return // category not specified (e.g. error importing survey from Collect)

      const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDefKey)(survey)
      const { request, cancel } = API.fetchCategoryItemsInLevelRequest({
        surveyId,
        categoryUuid,
        levelIndex,
        draft: false,
      })
      const nodeDefKeyUuid = NodeDef.getUuid(nodeDefKey)
      requestCancelByNodeDefUuid[nodeDefKeyUuid] = cancel
      request.then(({ data }) => {
        delete requestCancelByNodeDefUuid[nodeDefKeyUuid]
        const { items } = data
        categoryItemsByCodeDefUuid[nodeDefKeyUuid] = items
        if (Object.values(categoryItemsByCodeDefUuid).length === nodeDefCodeKeys.length) {
          setResult(categoryItemsByCodeDefUuid)
        }
      })
    })

    return () => {
      Object.values(requestCancelByNodeDefUuid).forEach((cancel) => {
        cancel()
      })
    }
  }, [survey])

  return result
}
