import { useEffect, useMemo, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

const noCategoryItems = {}

export const useNodeDefKeyAndSummaryCategoryItemsInLevel = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const [result, setResult] = useState(null)

  const nodeDefCodeKeys = useMemo(() => {
    const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
    const rootSummaryDefs = Survey.getRootSummaryDefs({ cycle })(survey)
    return [...nodeDefKeys, ...rootSummaryDefs].filter(NodeDef.isCode)
  }, [cycle, survey])

  useEffect(() => {
    const categoryItemsByCodeDefUuid = {}
    const requestCancelByNodeDefUuid = {}

    const surveyId = Survey.getId(survey)

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
  }, [nodeDefCodeKeys, survey])

  return nodeDefCodeKeys.length === 0 ? noCategoryItems : result
}
