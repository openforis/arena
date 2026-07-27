import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { UUIDs } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import * as JobSerialized from '@common/job/jobSerialized'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n, useSystemConfigFileUploadLimitMB } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { Dropzone, Fieldset } from '@webapp/components'
import { Checkbox, Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { FileUtils } from '@webapp/utils/fileUtils'

import { defaultChunkSize, FileUploadChunkSizeDropdown } from './FileUploadChunkSizeDropdown'
import { ImportStartButton } from './ImportStartButton'
import { ArenaImportPreviewDialog } from './ArenaImportPreviewDialog'

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

const generateImportSummary = ({ result, i18n }) =>
  Object.entries(result)
    .filter(
      ([key, value]) =>
        importSummaryItemKeys.includes(key) && (!importSummaryItemKeysExcludedIfEmpty.includes(key) || value > 0)
    )
    .reduce((acc, [summaryItemKey, summaryItemValue]) => {
      const summaryItemLabel = i18n.t(`dataImportView:jobs.ArenaDataImportJob.importSummaryItem.${summaryItemKey}`)
      acc.push(`- ${summaryItemLabel}: ${summaryItemValue}`)
      return acc
    }, [])
    .join('\n')

export const DataImportArenaView = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const fileMaxSizeMB = useSystemConfigFileUploadLimitMB()

  const [state, setState] = useState({
    cycle: surveyCycle,
    conflictResolutionStrategy: ConflictResolutionStrategy.skipExisting,
    file: null,
    fileId: null,
    chunkSize: defaultChunkSize,
    skipMissingFiles: false,
    previewItems: null,
  })

  const { cycle, conflictResolutionStrategy, file, fileId, chunkSize, skipMissingFiles, previewItems } = state

  const onImportJobComplete = useCallback(
    async (jobCompleted) => {
      setState((state) => ({ ...state, file: null, fileId: null, previewItems: null }))
      const result = JobSerialized.getResult(jobCompleted)
      const summary = generateImportSummary({ result, i18n })
      dispatch(
        NotificationActions.notifyInfo({
          key: 'dataImportView:jobs.ArenaDataImportJob.importCompleteSuccessfully',
          params: { summary },
          autoHide: false,
        })
      )
    },
    [dispatch, i18n]
  )

  const startImport = useCallback(
    async (selectedRecordsUuids) => {
      const { promise } = API.startDataImportFromArenaJob({
        surveyId,
        cycle,
        conflictResolutionStrategy,
        fileId,
        skipMissingFiles,
        reuseUploadedFile: true,
        selectedRecordsUuids,
      })
      const job = await promise
      dispatch(JobActions.showJobMonitor({ job, autoHide: true, onComplete: onImportJobComplete }))
    },
    [conflictResolutionStrategy, cycle, dispatch, fileId, onImportJobComplete, skipMissingFiles, surveyId]
  )

  const onPreviewConfirm = useCallback(
    (selectedRecordsUuids) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataImportView:startImportConfirm',
          onOk: () => startImport(selectedRecordsUuids),
        })
      )
    },
    [dispatch, startImport]
  )

  const onPreviewCancel = useCallback(() => {
    setState((state) => ({ ...state, previewItems: null }))
  }, [])

  const onPreviewJobComplete = useCallback((jobCompleted) => {
    const { items } = JobSerialized.getResult(jobCompleted)
    setState((state) => ({ ...state, previewItems: items }))
  }, [])

  const onPreviewJobStart = useCallback(
    (job) => {
      dispatch(JobActions.showJobMonitor({ job, autoHide: true, onComplete: onPreviewJobComplete }))
    },
    [dispatch, onPreviewJobComplete]
  )

  const onFilesDrop = useCallback(async (files) => {
    const _file = files.filter((file) => {
      const extension = FileUtils.getExtension(file)
      return acceptedFileExtensions.includes(extension)
    })[0]
    setState((state) => ({ ...state, file: _file, fileId: UUIDs.v4(), previewItems: null }))
  }, [])

  return (
    <div className="data-import">
      <div className="form">
        <Fieldset legend="dataImportView:options.header" className="data-import-options">
          {surveyCycleKeys.length > 1 && (
            <FormItem label="dataImportView:importIntoCycle">
              <CycleSelector selectedCycle={cycle} onChange={(cycle) => setState((state) => ({ ...state, cycle }))} />
            </FormItem>
          )}

          <FormItem
            info="dataImportView:conflictResolutionStrategy.info"
            label="dataImportView:conflictResolutionStrategy.label"
          >
            <Dropdown
              disabled={Boolean(previewItems)}
              itemLabel={(strategy) => i18n.t(`dataImportView:conflictResolutionStrategy.${strategy}`)}
              itemValue={(item) => item}
              items={Object.values(ConflictResolutionStrategy)}
              onChange={(conflictResolutionStrategy) => setState((state) => ({ ...state, conflictResolutionStrategy }))}
              selection={conflictResolutionStrategy}
            />
          </FormItem>

          <FormItem label="dataImportView:options.skipMissingFiles">
            <Checkbox
              checked={skipMissingFiles}
              onChange={(skipMissingFiles) => setState((state) => ({ ...state, skipMissingFiles }))}
            />
          </FormItem>
        </Fieldset>

        <Dropzone maxSize={fileMaxSizeMB} onDrop={onFilesDrop} accept={fileAccept} droppedFiles={file ? [file] : []} />

        <FileUploadChunkSizeDropdown
          className="display-flex"
          onChange={(value) => setState((state) => ({ ...state, chunkSize: value }))}
          value={chunkSize}
        />

        <ImportStartButton
          disabled={!file}
          label="dataImportView:importPreview.generatePreview"
          startFunction={API.startArenaImportSummaryJob}
          startFunctionParams={{
            surveyId,
            conflictResolutionStrategy,
            file,
            fileId,
            chunkSize,
          }}
          onUploadComplete={onPreviewJobStart}
        />
      </div>
      {previewItems && (
        <ArenaImportPreviewDialog items={previewItems} onCancel={onPreviewCancel} onConfirm={onPreviewConfirm} />
      )}
    </div>
  )
}
