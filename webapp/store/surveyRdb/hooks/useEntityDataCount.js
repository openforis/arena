import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey/hooks'
import { useMemo } from 'react'
import { useDataCountByEntityDefUuid } from './useDataCountByEntityDefUuid'

export const useEntityDataCount = (entityDefUuid) => {
  const survey = useSurvey()

  const entityDefArray = useMemo(() => {
    if (entityDefUuid) {
      const entity = entityDefUuid ? Survey.getNodeDefByUuid(entityDefUuid)(survey) : null
      return [entity]
    }
    return []
  }, [entityDefUuid, survey])

  const dataCountByEntityDefUuid = useDataCountByEntityDefUuid({ nodeDefs: entityDefArray })

  return dataCountByEntityDefUuid[entityDefUuid]
}
