import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import type { ArenaRecord } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import { ButtonIconDelete } from '@webapp/components'
import { useAppDispatch } from '@webapp/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { RecordActions } from '@webapp/store/ui/record'

import { RecordKeyValuesExtractor } from './recordKeyValuesExtractor'

type RecordDeleteButtonProps = {
  categoryItemsByCodeDefUuid?: { [codeDefUuid: string]: any[] } | null
  onRecordsUpdate?: () => void
  record: ArenaRecord
  testId?: string
}

export const RecordDeleteButton = (props: RecordDeleteButtonProps) => {
  const { categoryItemsByCodeDefUuid, onRecordsUpdate, record, testId } = props

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const keyValues = RecordKeyValuesExtractor.extractKeyValues({ survey, record, categoryItemsByCodeDefUuid, lang })

  const onDeleteConfirmed = useCallback(() => {
    dispatch(
      RecordActions.deleteRecord({
        navigate,
        recordUuid: Record.getUuid(record),
        goBackOnDelete: false,
        onRecordsUpdate,
      })
    )
  }, [dispatch, navigate, onRecordsUpdate, record])

  const onDeleteButtonClick = useCallback(
    (event) => {
      event.stopPropagation()
      event.preventDefault()

      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView:records.confirmDeleteRecord',
          params: { keyValues },
          onOk: onDeleteConfirmed,
        })
      )
    },
    [dispatch, keyValues, onDeleteConfirmed]
  )

  return <ButtonIconDelete testId={testId} title="dataView:records.deleteRecord" onClick={onDeleteButtonClick} />
}
