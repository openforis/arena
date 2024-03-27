import { useCallback, useEffect, useMemo, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as SurveyRdbApi from '@webapp/service/api/surveyRdb'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useDataCountByEntityDefUuid = ({ nodeDefs }) => {
  const survey = useSurvey()
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
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (Survey.isPublished(surveyInfo) || Survey.getCollectUri(surveyInfo)) {
      setDataCountsByEntityDefUuid(
        await SurveyRdbApi.fetchEntityViewDataRowsCountByDefUuid({
          surveyId: Survey.getId(survey),
          cycle,
          entityDefUuids,
        })
      )
    }
  }, [survey, cycle, entityDefUuids])

  useEffect(() => {
    updateCounts()
  }, [updateCounts])

  return dataCountByEntityDefUuid
}
