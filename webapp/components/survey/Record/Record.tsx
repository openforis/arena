import type { ArenaRecord } from '@openforis/arena-core'

import SurveyForm from '@webapp/components/survey/SurveyForm'
import { useI18n } from '@webapp/store/system'

import { useLocalState } from './store'

type RecordProps = {
  disableLockUnlock?: boolean
  disableValidationReport?: boolean
  editable?: boolean
  locked?: boolean
  noHeader?: boolean
  pageNodeUuid?: string
  record?: ArenaRecord
  recordUuid?: string
}

const Record = (props: RecordProps) => {
  const {
    disableLockUnlock = false,
    disableValidationReport = false,
    editable: editableProp = true,
    locked = false,
    noHeader = false,
    pageNodeUuid,
    record: recordProp = null,
    recordUuid,
  } = props
  const { editable, preview, record, recordLoadError } = useLocalState({
    editableProp,
    locked,
    noHeader,
    pageNodeUuid,
    recordProp,
    recordUuid,
  })

  const i18n = useI18n()

  if (recordLoadError) {
    return <div>{i18n.t('recordView.errorLoadingRecord', { details: i18n.t(recordLoadError) })}</div>
  }
  if (!record) {
    return null
  }
  return (
    <SurveyForm
      disableLockUnlock={disableLockUnlock}
      disableValidationReport={disableValidationReport}
      draft={preview}
      preview={preview}
      edit={false}
      entry
      canEditRecord={editable}
    />
  )
}

export default Record
