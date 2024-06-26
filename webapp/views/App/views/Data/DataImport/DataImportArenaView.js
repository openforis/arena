import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { NotificationActions } from '@webapp/store/ui'
import { Dropzone } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { FileUtils } from '@webapp/utils/fileUtils'
import { ImportStartButton } from './ImportStartButton'

const fileMaxSize = 1000 // 1 GB
const acceptedFileExtensions = ['zip']
const fileAccept = { '': acceptedFileExtensions.map((ext) => `.${ext}`) } // workaround to accept extensions containing special characters

export const DataImportArenaView = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const [cycle, setCycle] = useState(surveyCycle)
  const [file, setFile] = useState(null)

  const onImportJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: async (jobCompleted) => {
            setFile(null)
            const { processed, insertedRecords, skippedRecords, updatedRecords } = JobSerialized.getResult(jobCompleted)
            dispatch(
              NotificationActions.notifyInfo({
                key: 'dataImportView.jobs.ArenaDataImportJob.importCompleteSuccessfully',
                params: { processed, insertedRecords, skippedRecords, updatedRecords },
              })
            )
          },
        })
      )
    },
    [dispatch]
  )

  const onFilesDrop = useCallback(async (files) => {
    const _file = files.filter((file) => {
      const extension = FileUtils.getExtension(file)
      return acceptedFileExtensions.includes(extension)
    })[0]
    setFile(_file)
  }, [])

  return (
    <div className="data-import">
      <div className="form">
        {surveyCycleKeys.length > 1 && (
          <fieldset>
            <legend>{i18n.t('dataImportView.options.header')}</legend>

            {
              <FormItem className="display-flex" label={i18n.t('dataImportView.importIntoCycle')}>
                <CycleSelector selectedCycle={cycle} onChange={setCycle} />
              </FormItem>
            }
          </fieldset>
        )}

        <Dropzone maxSize={fileMaxSize} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        <ImportStartButton
          confirmMessageKey="dataImportView.startImportConfirm"
          disabled={!file}
          showConfirm
          startFunction={API.startDataImportFromArenaJob}
          startFunctionParams={{ surveyId, cycle, file }}
          onUploadComplete={onImportJobStart}
        />
      </div>
    </div>
  )
}
