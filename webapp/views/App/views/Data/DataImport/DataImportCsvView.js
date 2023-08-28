import './DataImportCsvView.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { RecordCycle } from '@core/record/recordCycle'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { ButtonDownload, ButtonIconInfo, Dropzone, Stepper } from '@webapp/components'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { DataImportCompleteDialog } from './DataImportCompleteDialog'
import { useDataImportCsvViewSteps } from './useDataImportCsvViewSteps'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { ImportStartButton } from './ImportStartButton'

const importTypes = {
  updateExistingRecords: 'updateExistingRecords',
  insertNewRecords: 'insertNewRecords',
}

const optionsRecordUpdate = ['preventAddingNewEntityData', 'preventUpdatingRecordsInAnalysis']

const fileMaxSize = 20 // 20MB

const allowedLabelTypes = [
  NodeDef.NodeDefLabelTypes.label,
  NodeDef.NodeDefLabelTypes.name,
  NodeDef.NodeDefLabelTypes.labelAndName,
]

export const DataImportCsvView = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const canSelectCycle = surveyCycleKeys.length > 1

  const [state, setState] = useState({
    cycle: canSelectCycle ? null : surveyCycle,
    dataImportType: null,
    file: null,
    jobCompleted: null,
    nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
    selectedEntityDefUuid: null,
    // options
    preventAddingNewEntityData: false,
    preventUpdatingRecordsInAnalysis: true,
  })

  const {
    cycle,
    dataImportType,
    file,
    jobCompleted,
    nodeDefLabelType,
    selectedEntityDefUuid,
    // options
    preventAddingNewEntityData,
    preventUpdatingRecordsInAnalysis,
  } = state

  const errorsExportFileName = `${Survey.getName(surveyInfo)}_(cycle-${RecordCycle.getLabel(cycle)})_ImportError`

  const { activeStep, steps } = useDataImportCsvViewSteps({ state, canSelectCycle })

  const setStateProp = useCallback((prop) => (value) => setState((statePrev) => ({ ...statePrev, [prop]: value })), [])

  const onEntitySelect = (entityDef) => setStateProp('selectedEntityDefUuid')(NodeDef.getUuid(entityDef))

  const onNodeDefLabelTypeChange = useCallback(() => {
    const nodeDefLabelTypeNext =
      allowedLabelTypes[(allowedLabelTypes.indexOf(nodeDefLabelType) + 1) % allowedLabelTypes.length]
    setStateProp('nodeDefLabelType')(nodeDefLabelTypeNext)
  }, [nodeDefLabelType, setStateProp])

  const onImportTypeChange = useCallback(
    (value) => {
      setState((statePrev) => {
        const stateNext = { ...statePrev, dataImportType: value }
        if (value === importTypes.insertNewRecords) {
          const nodeDefRoot = Survey.getNodeDefRoot(survey)
          stateNext.selectedEntityDefUuid = NodeDef.getUuid(nodeDefRoot)
          stateNext.preventAddingNewEntityData = false
          stateNext.preventUpdatingRecordsInAnalysis = false
        } else {
          stateNext.preventUpdatingRecordsInAnalysis = true
          stateNext.selectedEntityDefUuid = null
        }
        stateNext.file = null
        return stateNext
      })
    },
    [survey]
  )

  const onFilesDrop = (files) => {
    setStateProp('file')(files[0])
  }

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

  const importStartParams = {
    surveyId,
    file,
    cycle,
    entityDefUuid: selectedEntityDefUuid,
    insertNewRecords: dataImportType === importTypes.insertNewRecords,
    insertMissingNodes: !preventAddingNewEntityData,
    updateRecordsInAnalysis: !preventUpdatingRecordsInAnalysis,
  }

  return (
    <div className="main-container">
      <div className="steps-row">
        <ButtonIconInfo title="dataImportView.importFromCsvStepsInfo" markdown />
        <Stepper activeStep={activeStep} steps={steps} />
      </div>
      <div className="internal-container">
        <div className="form">
          {canSelectCycle && (
            <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
              <CycleSelector selectedCycle={cycle} onChange={setStateProp('cycle')} />
            </FormItem>
          )}

          {!Objects.isEmpty(cycle) && (
            <FormItem label={i18n.t('dataImportView.importType.label')}>
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
            <FormItem className="entity-form-item" label={i18n.t('dataImportView.importIntoEntity')}>
              <>
                <EntitySelectorTree
                  nodeDefLabelType={nodeDefLabelType}
                  nodeDefUuidActive={selectedEntityDefUuid}
                  onSelect={onEntitySelect}
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
        {selectedEntityDefUuid && (
          <div className="buttons-container">
            <ButtonDownload
              className="download-template-btn"
              href={API.getDataImportFromCsvTemplateUrl({ surveyId, cycle, entityDefUuid: selectedEntityDefUuid })}
              label="dataImportView.downloadTemplate"
              disabled={!selectedEntityDefUuid}
            />

            {dataImportType === importTypes.updateExistingRecords && (
              <fieldset>
                <legend>{i18n.t('dataImportView.options.header')}</legend>
                {optionsRecordUpdate.map((optionKey) => (
                  <Checkbox
                    key={optionKey}
                    checked={state[optionKey]}
                    label={`dataImportView.options.${optionKey}`}
                    onChange={setStateProp(optionKey)}
                  />
                ))}
              </fieldset>
            )}
            <Dropzone
              maxSize={fileMaxSize}
              accept={{ 'text/csv': ['.csv'] }}
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
          </div>
        )}
      </div>
      {jobCompleted && (
        <DataImportCompleteDialog
          job={jobCompleted}
          onClose={() => setStateProp('jobCompleted')(null)}
          errorsExportFileName={errorsExportFileName}
        />
      )}
    </div>
  )
}
