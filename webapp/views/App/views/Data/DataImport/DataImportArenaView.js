import './ImportStartButton.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { UUIDs } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import * as JobSerialized from '@common/job/jobSerialized'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'
import { useUserIsSystemAdmin } from '@webapp/store/user'

import { Dropzone } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { FileUtils } from '@webapp/utils/fileUtils'

import { ImportStartButton } from './ImportStartButton'

const acceptedFileExtensions = ['zip']
const fileAccept = { '': acceptedFileExtensions.map((ext) => `.${ext}`) } // workaround to accept extensions containing special characters

const missingFilesSummaryItemKey = 'missingFiles'
const importSummaryItemKeys = [
  'processed',
  'insertedRecords',
  'updatedRecords',
  'skippedRecords',
  missingFilesSummaryItemKey,
]
const importSummaryItemKeysExcludedIfEmpty = [missingFilesSummaryItemKey]

const defaultChunkSize = 1024 * 1024 * 10

const chunkSizeItems = [
  { value: defaultChunkSize, label: '10 MB' },
  { value: 1024 * 1024 * 100, label: '100 MB' },
  { value: 1024 * 1024 * 1024, label: '1 GB' },
  { value: '', label: 'Not set' },
]

const generateImportSummary = ({ result, i18n }) =>
  Object.entries(result)
    .filter(
      ([key, value]) =>
        importSummaryItemKeys.includes(key) && (!importSummaryItemKeysExcludedIfEmpty.includes(key) || value > 0)
    )
    .reduce((acc, [summaryItemKey, summaryItemValue]) => {
      const summaryItemLabel = i18n.t(`dataImportView.jobs.ArenaDataImportJob.importSummaryItem.${summaryItemKey}`)
      acc.push(`- ${summaryItemLabel}: ${summaryItemValue}`)
      return acc
    }, [])
    .join('\n')

export const DataImportArenaView = () => {
  const userIsSystemAdmin = useUserIsSystemAdmin()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const fileMaxSize = userIsSystemAdmin
    ? 2048 // 2 GB
    : 1024 // 1 GB

  const [state, setState] = useState({
    cycle: surveyCycle,
    conflictResolutionStrategy: ConflictResolutionStrategy.skipExisting,
    file: null,
    fileId: null,
    chunkSize: defaultChunkSize,
  })

  const { cycle, conflictResolutionStrategy, file, fileId, chunkSize } = state

  const onImportJobComplete = useCallback(
    async (jobCompleted) => {
      setState((state) => ({ ...state, file: null, fileId: null }))
      const result = JobSerialized.getResult(jobCompleted)
      const summary = generateImportSummary({ result, i18n })
      dispatch(
        NotificationActions.notifyInfo({
          key: 'dataImportView.jobs.ArenaDataImportJob.importCompleteSuccessfully',
          params: { summary },
          autoHide: false,
        })
      )
    },
    [dispatch, i18n]
  )

  const onImportJobStart = useCallback(
    (job) => {
      dispatch(JobActions.showJobMonitor({ job, autoHide: true, onComplete: onImportJobComplete }))
    },
    [dispatch, onImportJobComplete]
  )

  const onFilesDrop = useCallback(async (files) => {
    const _file = files.filter((file) => {
      const extension = FileUtils.getExtension(file)
      return acceptedFileExtensions.includes(extension)
    })[0]
    setState((state) => ({ ...state, file: _file, fileId: UUIDs.v4() }))
  }, [])

  return (
    <div className="data-import">
      <div className="form">
        {surveyCycleKeys.length > 1 && (
          <fieldset>
            <legend>{i18n.t('dataImportView.options.header')}</legend>
            <FormItem className="display-flex" label="dataImportView.importIntoCycle">
              <CycleSelector selectedCycle={cycle} onChange={(cycle) => setState((state) => ({ ...state, cycle }))} />
            </FormItem>
          </fieldset>
        )}

        <FormItem
          className="display-flex"
          info="dataImportView.conflictResolutionStrategy.info"
          label="dataImportView.conflictResolutionStrategy.label"
        >
          <Dropdown
            itemLabel={(strategy) => i18n.t(`dataImportView.conflictResolutionStrategy.${strategy}`)}
            itemValue={(item) => item}
            items={Object.values(ConflictResolutionStrategy)}
            onChange={(conflictResolutionStrategy) => setState((state) => ({ ...state, conflictResolutionStrategy }))}
            selection={conflictResolutionStrategy}
          />
        </FormItem>

        <Dropzone maxSize={fileMaxSize} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        {userIsSystemAdmin && (
          <FormItem className="display-flex" label="dataImportView.fileUploadChunkSize.label">
            <Dropdown
              items={chunkSizeItems}
              itemValue={(item) => item.value}
              onChange={(chunkSizeItem) => setState((state) => ({ ...state, chunkSize: chunkSizeItem.value }))}
              selection={chunkSizeItems.find((item) => item.value === chunkSize)}
            />
          </FormItem>
        )}

        <ImportStartButton
          confirmMessageKey="dataImportView.startImportConfirm"
          disabled={!file}
          showConfirm
          startFunction={API.startDataImportFromArenaJob}
          startFunctionParams={{ surveyId, cycle, conflictResolutionStrategy, file, fileId, chunkSize }}
          onUploadComplete={onImportJobStart}
        />
      </div>
    </div>
  )
}
