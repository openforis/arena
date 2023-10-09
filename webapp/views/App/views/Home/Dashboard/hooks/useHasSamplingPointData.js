import { useState, useEffect } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

export const useHasSamplingPointData = () => {
  const survey = useSurvey()
  const [hasSamplingPointData, setHasSamplingPointData] = useState(false)

  useEffect(() => {
    const samplingPointDataNodeDefs = Survey.getSamplingPointDataNodeDefs(survey)
    if (samplingPointDataNodeDefs.length === 0) {
      setHasSamplingPointData(false)
      return
    }
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
    const samplingPointDataNodeDefUuids = samplingPointDataNodeDefs.map(NodeDef.getUuid)
    const allKeysUseSamplingPointData = rootKeyDefs.every((rootKeyDef) =>
      samplingPointDataNodeDefUuids.includes(NodeDef.getUuid(rootKeyDef))
    )
    setHasSamplingPointData(allKeysUseSamplingPointData)
  }, [survey])

  return hasSamplingPointData
}

// NOTES:
// Use the endpoint to count the total amount of sampling point data - Check where is it used.
// Use the record summary to count the total amount of sampling point data records and cleansing data records
