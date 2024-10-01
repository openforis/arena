import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { NumberConversionUtils } from '@core/numberConversionUtils'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurveyInfo } from '@webapp/store/survey'
import { surveyInfoUpdate } from '@webapp/store/survey/surveyInfo/actions'
import { ConfigurationNumericItemEditor } from './ConfigurationNumericItemEditor'

const { dataStorageUnits, dataStorageValueToBytes, dataStorageValueToUnit, dataStorageBytesToUnit } =
  NumberConversionUtils

const defaultTotalSpaceGB = 10
const maxTotalSpaceGB = 100
const defaultTotalSpace = dataStorageValueToBytes(dataStorageUnits.GB)(defaultTotalSpaceGB)

export const SurveyConfigurationEditor = () => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)

  const { usedSpace, totalSpace } = filesStatistics
  const minTotalSpace = Math.max(usedSpace, defaultTotalSpace)
  const minTotalSpaceGB = dataStorageBytesToUnit(dataStorageUnits.GB)(minTotalSpace)
  const totalSpaceGB = dataStorageBytesToUnit(dataStorageUnits.GB)(totalSpace)

  const onTotalSpaceSave = useCallback(
    async (value) => {
      const valueToStore = dataStorageValueToUnit(dataStorageUnits.GB, dataStorageUnits.MB)(value)
      const { survey: surveyInfoUpdated } = await API.updateSurveyConfigurationProp({
        surveyId,
        key: Survey.configKeys.filesTotalSpace,
        value: valueToStore,
      })
      dispatch({ type: surveyInfoUpdate, surveyInfo: surveyInfoUpdated })
    },
    [dispatch, surveyId]
  )

  return (
    <div>
      <ConfigurationNumericItemEditor
        labelKey="homeView.surveyInfo.configuration.filesTotalSpace"
        maxValue={maxTotalSpaceGB}
        minValue={minTotalSpaceGB}
        onSave={onTotalSpaceSave}
        value={totalSpaceGB}
      />
    </div>
  )
}
