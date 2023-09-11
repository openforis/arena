import { useEffect, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurvey } from '@webapp/store/survey'

export const useNodeDefKeysCategoryItemsInLevel = () => {
  const survey = useSurvey()
  const [result, setResult] = useState({})

  useEffect(() => {
    const categoryItemsByCodeDefUuid = {}
    const requestCancelByNodeDefUuid = {}

    const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
    const surveyId = Survey.getId(survey)

    const nodeDefCodeKeys = nodeDefKeys.filter(NodeDef.isCode)
    nodeDefCodeKeys.forEach((nodeDefKey) => {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDefKey)
      if (!categoryUuid) return null // category not specified (e.g. error importing survey from Collect)

      const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDefKey)(survey)
      const { request, cancel } = API.fetchCategoryItemsInLevelRequest({
        surveyId,
        categoryUuid,
        levelIndex,
        draft: false,
      })
      requestCancelByNodeDefUuid[NodeDef.getUuid] = cancel
      request.then(({ data }) => {
        const { items } = data
        categoryItemsByCodeDefUuid[NodeDef.getUuid(nodeDefKey)] = items
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
