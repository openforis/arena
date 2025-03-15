import './DataImportFlatDataView.scss'

import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { RecordCycle } from '@core/record/recordCycle'

import { FileUtils } from '@webapp/utils/fileUtils'
import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useNodeDefByUuid, useSurvey, useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'
import { useUserIsSystemAdmin } from '@webapp/store/user'

import { ButtonIconInfo, Dropzone, ExpansionPanel, Stepper } from '@webapp/components'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { NodeDefTreeSelect } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { ButtonMenuExport } from '@webapp/components/buttons/ButtonMenuExport'

import { DataImportCompleteDialog } from './DataImportCompleteDialog'
import { useDataImportFlatDataViewSteps } from './useDataImportFlatDataViewSteps'
import { ImportStartButton } from './ImportStartButton'

const importTypes = {
  updateExistingRecords: 'updateExistingRecords',
  insertNewRecords: 'insertNewRecords',
}

const optionsRecordUpdate = ['preventAddingNewEntityData', 'preventUpdatingRecordsInAnalysis']
const infoVisibleByOption = {
  deleteExistingEntities: true,
}
const fileMaxSizeDefault = 20 // 20MB
const fileMaxSizeWithFiles = 1024 // 1GB

const allowedLabelTypes = [
  NodeDef.NodeDefLabelTypes.label,
  NodeDef.NodeDefLabelTypes.name,
  NodeDef.NodeDefLabelTypes.labelAndName,
]

export const DataImportFlatDataView = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()
  const isSystemAdmin = useUserIsSystemAdmin()
  const canSelectCycle = surveyCycleKeys.length > 1

  const [state, setState] = useState({
    cycle: canSelectCycle ? null : surveyCycle,
    dataImportType: null,
    file: null,
    jobCompleted: null,
    nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
    selectedNodeDefUuid: null,
    // options
    preventAddingNewEntityData: false,
    preventUpdatingRecordsInAnalysis: true,
    includeFiles: false,
    deleteExistingEntities: false,
  })

  const {
    cycle,
    dataImportType,
    file,
    fileFormat,
    jobCompleted,
    nodeDefLabelType,
    selectedNodeDefUuid,
    // options
    preventAddingNewEntityData,
    preventUpdatingRecordsInAnalysis,
    includeFiles,
    deleteExistingEntities,
  } = state

  const selectedNodeDef = useNodeDefByUuid(selectedNodeDefUuid)

  const allowedOptionsRecordUpdate = useMemo(() => {
    const _options = [...optionsRecordUpdate]
    if (isSystemAdmin) {
      _options.push('includeFiles')
      if (selectedNodeDef && !NodeDef.isRoot(selectedNodeDef)) {
        _options.push('deleteExistingEntities')
      }
      return _options
    }
  }, [isSystemAdmin, selectedNodeDef])

  const fileAccept = useMemo(
    () =>
      includeFiles
        ? FileUtils.acceptByExtension.zip
        : { ...FileUtils.acceptByExtension.csv, ...FileUtils.acceptByExtension.xlsx },
    [includeFiles]
  )

  const fileMaxSize = useMemo(() => (includeFiles ? fileMaxSizeWithFiles : fileMaxSizeDefault), [includeFiles])

  const errorsExportFileName = `${Survey.getName(surveyInfo)}_(cycle-${RecordCycle.getLabel(cycle)})_ImportError`

  const { activeStep, steps } = useDataImportFlatDataViewSteps({ state, canSelectCycle })

  const setStateProp = useCallback((prop) => (value) => setState((statePrev) => ({ ...statePrev, [prop]: value })), [])

  const onNodeDefSelect = (nodeDef) => {
    setState((statePrev) => ({
      ...statePrev,
      selectedNodeDefUuid: NodeDef.getUuid(nodeDef),
      deleteExistingEntities: false,
    }))
  }

  const onNodeDefLabelTypeChange = useCallback(() => {
    const nodeDefLabelTypeNext =
      allowedLabelTypes[(allowedLabelTypes.indexOf(nodeDefLabelType) + 1) % allowedLabelTypes.length]
    setStateProp('nodeDefLabelType')(nodeDefLabelTypeNext)
  }, [nodeDefLabelType, setStateProp])

  const onImportTypeChange = useCallback(
    (value) => {
      setState((statePrev) => {
        const stateNext = {
          ...statePrev,
          deleteExistingEntities: false,
          dataImportType: value,
          file: null,
        }
        if (value === importTypes.insertNewRecords) {
          const nodeDefRoot = Survey.getNodeDefRoot(survey)
          stateNext.selectedNodeDefUuid = NodeDef.getUuid(nodeDefRoot)
          stateNext.preventAddingNewEntityData = false
          stateNext.preventUpdatingRecordsInAnalysis = false
        } else {
          stateNext.preventUpdatingRecordsInAnalysis = true
          stateNext.selectedNodeDefUuid = null
        }
        return stateNext
      })
    },
    [survey]
  )

  const onFilesDrop = useCallback((files) => {
    const file = files[0]
    const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
    setState((statePrev) => ({ ...statePrev, file, fileFormat }))
  }, [])

  const onImportJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          errorKeyHeaderName: 'dataImportView.errors.rowNum',
          errorsExportFileName,
          onComplete: (jobCompleted) => {
            setState((statePrev) => ({ ...statePrev, jobCompleted }))
          },
        })
      )
    },
    [dispatch, errorsExportFileName]
  )

  const onJobCompletedDialogClose = useCallback(() => {
    if (JobSerialized.isSucceeded(jobCompleted)) {
      setState((statePrev) => {
        const stateNext = { ...statePrev, jobCompleted: null }
        if (JobSerialized.isSucceeded(jobCompleted) && !JobSerialized.getResult(jobCompleted).dryRun) {
          stateNext.file = null
        }
        return stateNext
      })
    }
  }, [jobCompleted])

  const importStartParams = {
    surveyId,
    file,
    fileFormat,
    cycle,
    nodeDefUuid: selectedNodeDefUuid,
    insertNewRecords: dataImportType === importTypes.insertNewRecords,
    insertMissingNodes: !preventAddingNewEntityData,
    deleteExistingEntities,
    updateRecordsInAnalysis: !preventUpdatingRecordsInAnalysis,
    includeFiles,
  }

  return (
    <div className="main-container">
      <div className="steps-row">
        <ButtonIconInfo title="dataImportView.importFromCsvStepsInfo" isTitleMarkdown />
        <Stepper activeStep={activeStep} steps={steps} />
      </div>
      <div className="internal-container">
        <div className="form">
          {canSelectCycle && (
            <FormItem label="dataImportView.importIntoCycle">
              <CycleSelector selectedCycle={cycle} onChange={setStateProp('cycle')} />
            </FormItem>
          )}

          {!Objects.isEmpty(cycle) && (
            <FormItem label="dataImportView.importType.label">
              <ButtonGroup
                selectedItemKey={dataImportType}
                onChange={onImportTypeChange}
                items={Object.values(importTypes).map((importType) => ({
                  key: importType,
                  label: i18n.t(`dataImportView.importType.${importType}`),
                }))}
              />
            </FormItem>
          )}

          {dataImportType && (
            <FormItem className="entity-form-item" label="dataImportView.importIntoMultipleEntityOrAttribute">
              <>
                <NodeDefTreeSelect
                  nodeDefLabelType={nodeDefLabelType}
                  nodeDefUuidActive={selectedNodeDefUuid}
                  includeMultipleAttributes
                  onSelect={onNodeDefSelect}
                  isDisabled={() => dataImportType === importTypes.insertNewRecords}
                />
                <NodeDefLabelSwitch
                  allowedLabelTypes={allowedLabelTypes}
                  labelType={nodeDefLabelType}
                  onChange={onNodeDefLabelTypeChange}
                />
              </>
            </FormItem>
          )}
        </div>
        <div className="buttons-container">
          {!Objects.isEmpty(cycle) && (
            <ButtonMenuExport
              className="download-templates-btn"
              href={API.getDataImportFromCsvTemplatesUrl({ surveyId })}
              label="dataImportView.downloadAllTemplates"
              requestParams={{ cycle, includeFiles }}
            />
          )}
          {selectedNodeDefUuid && (
            <>
              <ButtonMenuExport
                className="download-template-btn"
                href={API.getDataImportFromCsvTemplateUrl({ surveyId })}
                label="dataImportView.downloadTemplate"
                requestParams={{ cycle, nodeDefUuid: selectedNodeDefUuid, includeFiles }}
              />

              {dataImportType === importTypes.updateExistingRecords && (
                <ExpansionPanel buttonLabel="dataImportView.options.header" startClosed>
                  {allowedOptionsRecordUpdate.map((optionKey) => (
                    <Checkbox
                      key={optionKey}
                      checked={state[optionKey]}
                      label={`dataImportView.options.${optionKey}`}
                      info={infoVisibleByOption[optionKey] ? `dataImportView.optionsInfo.${optionKey}` : undefined}
                      infoParams={{ nodeDefName: NodeDef.getName(selectedNodeDef) }}
                      onChange={setStateProp(optionKey)}
                    />
                  ))}
                </ExpansionPanel>
              )}
              <Dropzone
                maxSize={fileMaxSize}
                accept={fileAccept}
                onDrop={onFilesDrop}
                droppedFiles={file ? [file] : []}
              />

              <div>
                <ImportStartButton
                  className="btn-secondary"
                  disabled={!file}
                  label="dataImportView.validateFile"
                  startFunction={API.startDataImportFromCsvJob}
                  startFunctionParams={{ ...importStartParams, dryRun: true }}
                  onUploadComplete={onImportJobStart}
                />
                <ButtonIconInfo title="dataImportView.validateFileInfo" />
              </div>

              <ImportStartButton
                confirmMessageKey="dataImportView.startImportConfirm"
                disabled={!file}
                showConfirm
                startFunction={API.startDataImportFromCsvJob}
                startFunctionParams={importStartParams}
                onUploadComplete={onImportJobStart}
              />
            </>
          )}
        </div>
      </div>
      {jobCompleted && (
        <DataImportCompleteDialog
          job={jobCompleted}
          onClose={onJobCompletedDialogClose}
          errorsExportFileName={errorsExportFileName}
        />
      )}
    </div>
  )
}
