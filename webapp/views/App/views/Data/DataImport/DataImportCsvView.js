import './DataImportCsvView.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { Button, ButtonDownload, Dropzone, Stepper } from '@webapp/components'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { DataImportCompleteDialog } from './DataImportSuccessfulDialog'
import { useDataImportCsvViewSteps } from './useDataImportCsvViewSteps'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

const importTypes = {
  updateExistingRecords: 'updateExistingRecords',
  insertNewRecords: 'insertNewRecords',
}

const fileMaxSize = 20 // 20MB

const allowedLabelTypes = [
  NodeDef.NodeDefLabelTypes.label,
  NodeDef.NodeDefLabelTypes.name,
  NodeDef.NodeDefLabelTypes.labelAndName,
]

export const DataImportCsvView = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const canSelectCycle = surveyCycleKeys.length > 1

  const [state, setState] = useState({
    cycle: canSelectCycle ? null : surveyCycle,
    dataImportType: null,
    file: null,
    importCompleteResult: null,
    nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
    preventAddingNewEntityData: false,
    preventUpdatingRecordsInAnalysis: true,
    selectedEntityDefUuid: null,
  })

  const {
    cycle,
    dataImportType,
    file,
    importCompleteResult,
    nodeDefLabelType,
    preventAddingNewEntityData,
    preventUpdatingRecordsInAnalysis,
    selectedEntityDefUuid,
  } = state

  const { activeStep, steps } = useDataImportCsvViewSteps({ state, canSelectCycle })

  const setStateProp = (prop) => (value) => setState((statePrev) => ({ ...statePrev, [prop]: value }))

  const onEntitySelect = (entityDef) => setStateProp('selectedEntityDefUuid')(NodeDef.getUuid(entityDef))

  const onNodeDefLabelTypeChange = useCallback(() => {
    const nodeDefLabelTypeNext =
      allowedLabelTypes[(allowedLabelTypes.indexOf(nodeDefLabelType) + 1) % allowedLabelTypes.length]
    setStateProp('nodeDefLabelType')(nodeDefLabelTypeNext)
  }, [nodeDefLabelType])

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

  const onStartImport = async () => {
    const job = await API.startDataImportFromCsvJob({
      surveyId,
      file,
      cycle,
      entityDefUuid: selectedEntityDefUuid,
      insertNewRecords: dataImportType === importTypes.insertNewRecords,
      insertMissingNodes: !preventAddingNewEntityData,
      updateRecordsInAnalysis: !preventUpdatingRecordsInAnalysis,
    })
    dispatch(
      JobActions.showJobMonitor({
        job,
        autoHide: true,
        onComplete: async (jobCompleted) => {
          const importCompleteResult = JobSerialized.getResult(jobCompleted)
          setState((statePrev) => ({ ...statePrev, importCompleteResult }))
        },
      })
    )
  }

  return (
    <div className="main-container">
      <Stepper activeStep={activeStep} steps={steps} />

      <div className="internal-container">
        <div className="form">
          {canSelectCycle && (
            <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
              <CycleSelector surveyCycleKey={cycle} onChange={setStateProp('cycle')} />
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
                <Checkbox
                  checked={preventAddingNewEntityData}
                  label={i18n.t('dataImportView.options.preventAddingNewEntityData')}
                  onChange={setStateProp('preventAddingNewEntityData')}
                />
                <Checkbox
                  checked={preventUpdatingRecordsInAnalysis}
                  label={i18n.t('dataImportView.options.preventUpdatingRecordsInAnalysis')}
                  onChange={setStateProp('preventUpdatingRecordsInAnalysis')}
                />
              </fieldset>
            )}

            <Dropzone
              maxSize={fileMaxSize}
              accept={{ 'text/csv': ['.csv'] }}
              onDrop={onFilesDrop}
              droppedFiles={file ? [file] : []}
            />

            <Button
              className="btn-primary start-btn"
              disabled={!file}
              label={'dataImportView.startImport'}
              onClick={onStartImport}
            />
          </div>
        )}
      </div>
      {importCompleteResult && (
        <DataImportCompleteDialog
          importCompleteResult={importCompleteResult}
          onClose={() => setStateProp('importCompleteResult')(null)}
        />
      )}
    </div>
  )
}
