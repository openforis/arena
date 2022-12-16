import './DataImportCsvView.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

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
import { Accordion, Button, ButtonDownload, Dropzone } from '@webapp/components'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { DataImportCompleteDialog } from './DataImportSuccessfulDialog'

const importTypes = {
  updateExistingRecords: 'updateExistingRecords',
  insertNewRecords: 'insertNewRecords',
}

const fileMaxSize = 20 * 1024 * 1024 // 20MB

export const DataImportCsvView = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const [state, setState] = useState({
    cycle: surveyCycle,
    dataImportType: importTypes.updateExistingRecords,
    file: null,
    importCompleteResult: null,
    insertMissingNodes: null,
    insertMissingNodesDisabled: false,
    selectedEntityDefUuid: null,
  })
  const { cycle, dataImportType, file, importCompleteResult, insertMissingNodes, selectedEntityDefUuid } = state

  const insertMissingNodesDisabled = dataImportType === importTypes.insertNewRecords

  const setStateProp = (prop) => (value) => setState((statePrev) => ({ ...statePrev, [prop]: value }))

  const onEntitySelect = (entityDef) => setStateProp('selectedEntityDefUuid')(NodeDef.getUuid(entityDef))

  const onDataImportTypeChange = useCallback(
    (value) => {
      setState((statePrev) => {
        const stateNext = { ...statePrev, dataImportType: value }
        if (value === importTypes.insertNewRecords) {
          const nodeDefRoot = Survey.getNodeDefRoot(survey)
          stateNext.selectedEntityDefUuid = NodeDef.getUuid(nodeDefRoot)
          stateNext.insertMissingNodes = false
        }
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
      insertMissingNodes,
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
      <div className="form">
        <FormItem label={i18n.t('dataImportView.importType.label')}>
          <ButtonGroup
            selectedItemKey={dataImportType}
            onChange={onDataImportTypeChange}
            items={Object.values(importTypes).map((importType) => ({
              key: importType,
              label: i18n.t(`dataImportView.importType.${importType}`),
            }))}
          />
        </FormItem>

        {surveyCycleKeys.length > 1 && (
          <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
            <CycleSelector surveyCycleKey={cycle} onChange={setStateProp('cycle')} />
          </FormItem>
        )}

        <FormItem label={i18n.t('dataImportView.importIntoEntity')}>
          <EntitySelectorTree
            nodeDefUuidActive={selectedEntityDefUuid}
            onSelect={onEntitySelect}
            isDisabled={() => dataImportType === importTypes.insertNewRecords}
          />
        </FormItem>
      </div>
      <div className="buttons-container">
        <ButtonDownload
          href={API.getDataImportFromCsvTemplateUrl({ surveyId, cycle, entityDefUuid: selectedEntityDefUuid })}
          label="dataImportView.downloadTemplate"
          disabled={!selectedEntityDefUuid}
        />

        <Accordion title="dataImportView.options.header">
          <Checkbox
            checked={insertMissingNodes}
            disabled={insertMissingNodesDisabled}
            label={i18n.t('dataImportView.options.insertMissingNodes')}
            onChange={setStateProp('insertMissingNodes')}
          />
        </Accordion>
      </div>
      <div className="bottom-container">
        {selectedEntityDefUuid && (
          <>
            <Dropzone
              maxSize={fileMaxSize}
              accept={{ 'text/csv': ['.csv'] }}
              onDrop={onFilesDrop}
              droppedFiles={file ? [file] : []}
            />

            <Button
              className="btn-primary"
              disabled={!file}
              label={'dataImportView.startImport'}
              onClick={onStartImport}
            />
          </>
        )}
        {importCompleteResult && (
          <DataImportCompleteDialog
            importCompleteResult={importCompleteResult}
            onClose={() => setStateProp('importCompleteResult')(null)}
          />
        )}
      </div>
    </div>
  )
}
