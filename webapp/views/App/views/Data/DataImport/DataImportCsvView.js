import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import UploadButton from '@webapp/components/form/uploadButton'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyId } from '@webapp/store/survey'

import { TestId } from '@webapp/utils/testId'
import { NotificationActions } from '@webapp/store/ui'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { ButtonDownload } from '@webapp/components'

export const DataImportCsvView = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const surveyCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const dispatch = useDispatch()

  const [cycle, setCycle] = useState(surveyCycle)
  const [selectedEntityDefUuid, setSelectedEntityDefUuid] = useState(null)

  const onEntitySelect = (entityDef) => setSelectedEntityDefUuid(NodeDef.getUuid(entityDef))

  const startImportJob = async (file) => {
    const job = await API.startDataImportFromCsvJob({
      surveyId,
      file,
      cycle,
      entityDefUuid: selectedEntityDefUuid,
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

      <FormItem label={i18n.t('dataImportView.importIntoEntity')}>
        <EntitySelectorTree nodeDefUuidActive={selectedEntityDefUuid} onSelect={onEntitySelect} />
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
