import { useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

/**
 * Whether the active survey identifies records via sampling-point data keys.
 *
 * @returns {boolean} True when all root key defs map to sampling-point data node defs.
 */
export const useHasSamplingPointData = (): boolean => {
  const survey = useSurvey()
  return useMemo(() => {
    if (!survey) return false
    const samplingPointDataNodeDefs = Survey.getSamplingPointDataNodeDefs(survey)
    if (samplingPointDataNodeDefs.length === 0) return false
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
    const samplingPointDataNodeDefUuids = new Set(samplingPointDataNodeDefs.map(NodeDef.getUuid))
    return rootKeyDefs.every((rootKeyDef) => samplingPointDataNodeDefUuids.has(NodeDef.getUuid(rootKeyDef)))
  }, [survey])
}
