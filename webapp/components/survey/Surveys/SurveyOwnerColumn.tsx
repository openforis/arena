import { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as API from '@webapp/service/api'
import { useAuthCanEditSurveyOwner } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'
import { EditableColumn } from '@webapp/components/DataGrid/EditableColumn'

import { SurveyOwnerDropdown } from './SurveyOwnerDropdown'
import { useAppDispatch } from '@webapp/store'
import type { ArenaSurvey } from '@openforis/arena-core'

type SurveyOwnerColumnProps = {
  item: ArenaSurvey
  onSurveysUpdate?: (...args: any[]) => any
}

export const SurveyOwnerColumn = (props: SurveyOwnerColumnProps) => {
  const { item: surveyInfo, onSurveysUpdate } = props

  const dispatch = useAppDispatch()

  const surveyId = Survey.getId(surveyInfo)
  const ownerUuid = Survey.getOwnerUuid(surveyInfo)
  const surveyName = Survey.getName(surveyInfo)

  const canEdit = useAuthCanEditSurveyOwner()

  const onChangeConfirmed = useCallback(
    async ({ selectedOwnerUuid }) => {
      await API.updateSurveyOwner({ surveyId, ownerUuid: selectedOwnerUuid })
      await onSurveysUpdate?.()
    },
    [onSurveysUpdate, surveyId]
  )

  const onChange = useCallback(
    (selectedOwner) => {
      const selectedOwnerUuid = User.getUuid(selectedOwner)
      if (selectedOwnerUuid !== ownerUuid) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'surveysView.confirmUpdateSurveyOwner',
            params: { surveyName, ownerName: User.getName(selectedOwner) },
            onOk: () => onChangeConfirmed({ selectedOwnerUuid }),
          })
        )
      }
    },
    [dispatch, onChangeConfirmed, ownerUuid, surveyName]
  )

  return (
    <EditableColumn
      canEdit={canEdit}
      className="owner-col"
      item={surveyInfo}
      renderItem={({ item }) => Survey.getOwnerName(item) || '---'}
      renderItemEditing={() => <SurveyOwnerDropdown selectedUuid={ownerUuid} onChange={onChange} />}
    />
  )
}
