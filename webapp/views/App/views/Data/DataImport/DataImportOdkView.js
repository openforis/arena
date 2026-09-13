import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useSystemConfigFileUploadLimitMB } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { DialogConfirmActions } from '@webapp/store/ui'
import { Dropzone } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'

import { ImportStartButton } from './ImportStartButton'

const fileAccept = { 'application/zip': ['.zip'] }

export const DataImportOdkView = () => {
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const fileMaxSizeMB = useSystemConfigFileUploadLimitMB()

  const [cycle, setCycle] = useState(surveyCycle)
  const [file, setFile] = useState(null)

  const onJobComplete = useCallback(
    async (jobCompleted) => {
      const { submittedCount, skippedCount } = JobSerialized.getResult(jobCompleted)
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataImportView:jobs.OdkDataImportJob.importCompleteSuccessfully',
          params: { submittedCount, skippedCount },
          dismissable: false,
        })
      )
    },
    [dispatch]
  )

  const onJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: onJobComplete,
        })
      )
    },
    [dispatch, onJobComplete]
  )

  const onFilesDrop = async (files) => {
    setFile(files[0])
  }

  return (
    <div className="data-import">
      <div className="form">
        {surveyCycleKeys.length > 1 && (
          <FormItem className="display-flex" label="dataImportView:importIntoCycle">
            <CycleSelector selectedCycle={cycle} onChange={setCycle} />
          </FormItem>
        )}

        <Dropzone maxSize={fileMaxSizeMB} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        <ImportStartButton
          disabled={!file}
          startFunction={API.startOdkDataImportJob}
          startFunctionParams={{ surveyId, file, cycle }}
          onUploadComplete={onJobStart}
        />
      </div>
    </div>
  )
}
