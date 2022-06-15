import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyRdbApi from '@webapp/service/api/surveyRdb'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useEntityViewDataCounts = ({ nodeDefs }) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [countsByEntityDefUuid, setCountsByEntityDefUuid] = useState({})

  const entityDefUuids = useMemo(() => {
    const uuidsSet = nodeDefs.reduce((entityDefUuidsSet, analysisNodeDef) => {
      const parentUuid = NodeDef.getParentUuid(analysisNodeDef)
      if (parentUuid) {
        entityDefUuidsSet.add(parentUuid)
      }
      return entityDefUuidsSet
    }, new Set())
    return [...uuidsSet.values()]
  }, [nodeDefs])

  const updateCounts = useCallback(async () => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (Survey.isPublished(surveyInfo) || Survey.getCollectUri(surveyInfo)) {
      setCountsByEntityDefUuid(
        await SurveyRdbApi.fetchEntityViewDataCounts({
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

  return countsByEntityDefUuid
}
