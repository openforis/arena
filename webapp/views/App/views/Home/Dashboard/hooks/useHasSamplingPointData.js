import { useState, useEffect } from 'react'
import * as Survey from '@core/survey/survey'
import { useSurvey } from '@webapp/store/survey'

export const useHasSamplingPointData = () => {
  const survey = useSurvey()
  const [hasSamplingPointData, setHasSamplingPointData] = useState(false)

  useEffect(() => {
    const samplingPointDataNodeDefs = Survey.getSamplingPointDataNodeDefs(survey)
    setHasSamplingPointData(samplingPointDataNodeDefs.length > 0)
  }, [survey])

  return hasSamplingPointData
}

// NOTES:
// Use the endpoint to count the total amount of sampling point data - Check where is it used.
// Use the record summary to count the total amount of sampling point data records and cleansing data records
