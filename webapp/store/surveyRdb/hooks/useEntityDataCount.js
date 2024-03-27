import { useMemo } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey/hooks'

import { useDataCountByEntityDefUuid } from './useDataCountByEntityDefUuid'

export const useEntityDataCount = (entityDefUuid) => {
  const survey = useSurvey()

  const entityDefArray = useMemo(
    () => (entityDefUuid ? [Survey.getNodeDefByUuid(entityDefUuid)(survey)] : []),
    [entityDefUuid, survey]
  )

  const dataCountByEntityDefUuid = useDataCountByEntityDefUuid({ nodeDefs: entityDefArray })

  return dataCountByEntityDefUuid[entityDefUuid]
}
