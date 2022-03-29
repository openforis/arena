import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { TestId } from '@webapp/utils/testId'
import { NotificationActions } from '@webapp/store/ui'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { ButtonDownload } from '@webapp/components'
import { ButtonGroup } from '@webapp/components/form'

const importTypes = {
  updateExistingRecords: 'updateExistingRecords',
  insertNewRecords: 'insertNewRecords',
}

export const DataImportCsvView = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const [cycle, setCycle] = useState(surveyCycle)
  const [selectedEntityDefUuid, setSelectedEntityDefUuid] = useState(null)
  const [dataImportType, setDataImportType] = useState(importTypes.updateExistingRecords)

  const onEntitySelect = (entityDef) => setSelectedEntityDefUuid(NodeDef.getUuid(entityDef))

  const onDataImportTypeChange = useCallback(
    (value) => {
      setDataImportType(value)
      if (value === importTypes.insertNewRecords) {
        const nodeDefRoot = Survey.getNodeDefRoot(survey)
        setSelectedEntityDefUuid(NodeDef.getUuid(nodeDefRoot))
      }
    },
    [survey, setDataImportType, setSelectedEntityDefUuid]
  )

  const startImportJob = async (file) => {
    const job = await API.startDataImportFromCsvJob({
      surveyId,
      file,
      cycle,
      entityDefUuid: selectedEntityDefUuid,
      insertNewRecords: dataImportType === importTypes.insertNewRecords,
    })
    dispatch(
      JobActions.showJobMonitor({
        job,
        autoHide: true,
        onComplete: async (jobCompleted) => {
          // const { insertedRecords } = JobSerialized.getResult(jobCompleted)
          dispatch(
            NotificationActions.notifyInfo({
              key: 'dataImportView.importComplete',
              // params: { insertedRecords },
            })
          )
        },
      })
    )
  }

  const onFileChange = async (file) => {
    await startImportJob(file)
  }

  return (
    <div className="form">
      {surveyCycleKeys.length > 1 && (
        <FormItem label={i18n.t('dataImportView.importIntoCycle')}>
          <CycleSelector surveyCycleKey={cycle} onChange={setCycle} />
        </FormItem>
      )}

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

      <FormItem label={i18n.t('dataImportView.importIntoEntity')}>
        <EntitySelectorTree
          nodeDefUuidActive={selectedEntityDefUuid}
          onSelect={onEntitySelect}
          isDisabled={() => dataImportType === importTypes.insertNewRecords}
        />
      </FormItem>

      <ButtonDownload
        href={API.getDataImportFromCsvTemplateUrl({ surveyId, cycle, entityDefUuid: selectedEntityDefUuid })}
        label="dataImportView.downloadTemplate"
        disabled={!selectedEntityDefUuid}
      />

      <UploadButton
        inputFieldId={TestId.recordsImport.importDataBtn}
        label={i18n.t('dataImportView.selectCSVFileToImport')}
        accept=".csv"
        onChange={(files) => onFileChange(files[0])}
        disabled={!selectedEntityDefUuid}
      />
    </div>
  )
}
