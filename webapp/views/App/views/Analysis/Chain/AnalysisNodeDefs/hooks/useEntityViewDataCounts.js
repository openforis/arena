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
    const uuidsSet = nodeDefs.reduce(
      (entityDefUuidsSet, analysisNodeDef) => entityDefUuidsSet.add(NodeDef.getParentUuid(analysisNodeDef)),
      new Set()
    )
    return [...uuidsSet.values()]
  }, [nodeDefs])

  const updateCounts = useCallback(async () => {
    setCountsByEntityDefUuid(
      await SurveyRdbApi.fetchEntityViewDataCounts({
        surveyId: Survey.getId(survey),
        cycle,
        entityDefUuids: [...entityDefUuids.values()],
      })
    )
  }, [survey, cycle, entityDefUuids])

  useEffect(() => {
    updateCounts()
  }, [updateCounts])

  return countsByEntityDefUuid
}
