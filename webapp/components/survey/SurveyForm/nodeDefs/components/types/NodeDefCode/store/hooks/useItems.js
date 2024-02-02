import { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'

import { useItemsFilter } from '../../../useItemsFilter'
import { ItemsCache } from '@server/modules/analysis/service/rChain/ItemsCache'
import { useSurvey } from '@webapp/store/survey'
import { useRecordParentCategoryItemUuid } from '@webapp/store/ui/record/hooks'

const itemsCache = new ItemsCache()
const isFetchingByKey = {}

const itemsFetchListenersByKey = {}

const addItemsFetchListener = (cacheKey, listener) => {
  let fetchCompleteListeners = itemsFetchListenersByKey[cacheKey]
  if (!fetchCompleteListeners) {
    fetchCompleteListeners = []
    itemsFetchListenersByKey[cacheKey] = fetchCompleteListeners
  }
  fetchCompleteListeners.push(listener)
}

const processItemsFetchListeners = (cacheKey) => {
  itemsFetchListenersByKey[cacheKey]?.forEach((listener) => listener())
  delete itemsFetchListenersByKey[cacheKey]
}

export const useItems = ({ nodeDef, parentNode, draft, edit, entryDataQuery }) => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const [itemsArray, setItemsArray] = useState([])

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = useRecordParentCategoryItemUuid({ nodeDef, parentNode })

  const requestDependencies = [edit, categoryUuid, categoryLevelIndex, parentCategoryItemUuid]
  const cacheKey = JSON.stringify(requestDependencies)
  const itemsInCache = itemsCache.get(cacheKey)
  const fetchFromServerCondition =
    !edit && categoryUuid && (parentCategoryItemUuid || categoryLevelIndex === 0) && !itemsInCache

  const fetchCompleteListener = useCallback(() => {
    setItemsArray(itemsCache.get(cacheKey))
  }, [cacheKey])

  const handleFetch = useCallback(
    ({ data: { items: _items } }) => {
      itemsCache.add(cacheKey, Object.values(_items))
      delete isFetchingByKey[cacheKey]
      processItemsFetchListeners(cacheKey)
    },
    [cacheKey]
  )

  if (itemsInCache && itemsArray !== itemsInCache) {
    setItemsArray(itemsInCache)
  } else if (fetchFromServerCondition) {
    addItemsFetchListener(cacheKey, fetchCompleteListener)

    if (!isFetchingByKey[cacheKey]) {
      isFetchingByKey[cacheKey] = true
      API.fetchCategoryItems({ surveyId, categoryUuid, draft, parentUuid: parentCategoryItemUuid }).request.then(
        handleFetch
      )
    }
  }

  // const alwaysIncludeItemFunction = useCallback(
  //   () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
  //   [entryDataQuery]
  // )

  // return useItemsFilter({ survey, nodeDef, record, parentNode, items, alwaysIncludeItemFunction })

  return itemsArray
}
