import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyRdbApi from '@webapp/service/api/surveyRdb'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useDataCountByEntityDefUuid = ({ nodeDefs }) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [dataCountByEntityDefUuid, setDataCountsByEntityDefUuid] = useState({})

  const entityDefUuids = useMemo(() => {
    const uuidsSet = nodeDefs.reduce((entityDefUuidsSet, analysisNodeDef) => {
      const parentUuid = NodeDef.getParentUuid(analysisNodeDef)
      if (parentUuid) {
        const parentEntityDef = Survey.getNodeDefByUuid(parentUuid)(survey)
        if (parentEntityDef && NodeDef.isInCycle(cycle)(parentEntityDef)) {
          entityDefUuidsSet.add(parentUuid)
        }
      }
      return entityDefUuidsSet
    }, new Set())
    return [...uuidsSet.values()]
  }, [nodeDefs])

  const updateCounts = useCallback(async () => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (Survey.isPublished(surveyInfo) || Survey.getCollectUri(surveyInfo)) {
      setDataCountsByEntityDefUuid(
        await SurveyRdbApi.fetchEntityViewDataRowsCountByDefUuid({
          surveyId: Survey.getId(survey),
          cycle,
          entityDefUuids: [...entityDefUuids.values()],
        })
      )
    }
  }, [survey, cycle, entityDefUuids])

  useEffect(() => {
    updateCounts()
  }, [updateCounts])

  return dataCountByEntityDefUuid
}
