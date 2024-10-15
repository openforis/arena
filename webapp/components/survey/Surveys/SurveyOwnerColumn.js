import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'

import * as API from '@webapp/service/api'
import { useAuthCanEditSurveyOwner } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'
import { EditableColumn } from '@webapp/components/DataGrid/EditableColumn'

import { SurveyOwnerDropdown } from './SurveyOwnerDropdown'

export const SurveyOwnerColumn = (props) => {
  const { item: surveyInfo, onSurveysUpdate } = props

  const dispatch = useDispatch()

  const surveyId = Survey.getId(surveyInfo)
  const ownerUuid = Survey.getOwnerUuid(surveyInfo)
  const ownerName = Survey.getOwnerName(surveyInfo)

  const canEdit = useAuthCanEditSurveyOwner()

  const onChangeConfirmed = useCallback(
    async ({ selectedOwnerUuid }) => {
      await API.updateSurveyOwner({ surveyId, ownerUuid: selectedOwnerUuid })
      await onSurveysUpdate?.()
    },
    [onSurveysUpdate, surveyId]
  )

  const onChange = useCallback(
    async (selectedOwner) => {
      const selectedOwnerUuid = User.getUuid(selectedOwner)
      if (selectedOwnerUuid !== ownerUuid) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView.records.confirmUpdateRecordOwner',
            params: { ownerName: User.getName(selectedOwner) },
            onOk: async () => onChangeConfirmed({ selectedOwnerUuid }),
          })
        )
      }
    },
    [dispatch, onChangeConfirmed, ownerUuid]
  )

  if (!canEdit) {
    return ownerName
  }

  return (
    <EditableColumn
      canEdit={canEdit}
      className="survey-owner-col"
      item={surveyInfo}
      renderItem={({ item }) => Record.getOwnerName(item)}
      renderItemEditing={() => <SurveyOwnerDropdown selectedUuid={ownerUuid} onChange={onChange} />}
    />
  )
}

SurveyOwnerColumn.propTypes = {
  item: PropTypes.object.isRequired,
  onSurveysUpdate: PropTypes.func,
}
