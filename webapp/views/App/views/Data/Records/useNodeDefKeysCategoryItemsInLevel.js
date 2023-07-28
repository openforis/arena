import { useEffect, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'

export const useNodeDefKeysCategoryItemsInLevel = ({ survey }) => {
  const [result, setResult] = useState({})

  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)

  useEffect(() => {
    const categoryItemsByCodeDefUuid = {}
    const requestCancelByNodeDefUuid = {}

    const surveyId = Survey.getId(survey)

    const nodeDefCodeKeys = nodeDefKeys.filter(NodeDef.isCode)
    nodeDefCodeKeys.forEach((nodeDefKey) => {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDefKey)
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
  }, [])
  return result
}
