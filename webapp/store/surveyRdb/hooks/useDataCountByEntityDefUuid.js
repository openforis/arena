import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { debounce } from '@core/functionsDefer'

import * as SurveyRdbApi from '@webapp/service/api/surveyRdb'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useDataCountByEntityDefUuid = ({ nodeDefs }) => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const canHaveData = Survey.canHaveData(surveyInfo)
  const cycle = useSurveyCycleKey()

  const [dataCountByEntityDefUuid, setDataCountsByEntityDefUuid] = useState({})

  const entityDefUuids = useMemo(() => {
    const uuidsSet = nodeDefs.reduce((entityDefUuidsSet, nodeDef) => {
      if (NodeDef.isMultipleEntity(nodeDef)) {
        entityDefUuidsSet.add(NodeDef.getUuid(nodeDef))
      }
      const ancestorMultipleEntityDef = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
      if (ancestorMultipleEntityDef && NodeDef.isInCycle(cycle)(ancestorMultipleEntityDef)) {
        entityDefUuidsSet.add(NodeDef.getUuid(ancestorMultipleEntityDef))
      }
      return entityDefUuidsSet
    }, new Set())
    return [...uuidsSet.values()]
  }, [cycle, nodeDefs, survey])

  const updateCounts = useCallback(async () => {
    if (canHaveData) {
      setDataCountsByEntityDefUuid(
        await SurveyRdbApi.fetchEntityViewDataRowsCountByDefUuid({
          surveyId,
          cycle,
          entityDefUuids,
        })
      )
    }
  }, [surveyId, cycle, canHaveData, entityDefUuids])

  useEffect(() => {
    debounce(updateCounts, `data-counts-update-${surveyId}`, 2000)()
  }, [surveyId, updateCounts])

  return dataCountByEntityDefUuid
}
