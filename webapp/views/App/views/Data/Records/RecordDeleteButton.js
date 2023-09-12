import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Record from '@core/record/record'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { RecordActions } from '@webapp/store/ui/record'

import { ButtonDelete } from '@webapp/components'

import { RecordKeyValuesExtractor } from './recordKeyValuesExtractor'

export const RecordDeleteButton = (props) => {
  const { categoryItemsByCodeDefUuid, onRecordsUpdate, record, testId } = props

  const dispatch = useDispatch()
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
          key: 'dataView.records.confirmDeleteRecord',
          params: { keyValues },
          onOk: onDeleteConfirmed,
        })
      )
    },
    [dispatch, keyValues, onDeleteConfirmed]
  )

  return (
    <ButtonDelete
      testId={testId}
      title="dataView.records.deleteRecord"
      showLabel={false}
      onClick={onDeleteButtonClick}
    />
  )
}
