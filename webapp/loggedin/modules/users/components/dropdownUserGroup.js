import React from 'react'
import { useSelector } from 'react-redux'
import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import Dropdown from '@webapp/commonComponents/form/dropdown'
import { useI18n } from '@webapp/commonComponents/hooks'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

const DropdownUserGroup = props => {
  const { editingLoggedUser, groupUuid, disabled, validation, onChange } = props

  const user = useSelector(AppState.getUser)
  const surveyInfo = useSelector(SurveyState.getSurveyInfo)
  const i18n = useI18n()

  const surveyGroups =
    editingLoggedUser && !surveyInfo // This can happen for system administrators when they don't have an active survey
      ? []
      : Survey.isPublished(surveyInfo)
      ? Survey.getAuthGroups(surveyInfo)
      : [Survey.getAuthGroupAdmin(surveyInfo)]

  // Add SystemAdmin group if current user is a SystemAdmin himself
  const groups = R.when(R.always(User.isSystemAdmin(user)), R.concat(User.getAuthGroups(user)))(surveyGroups)

  return (
    <Dropdown
      disabled={disabled}
      validation={validation}
      placeholder={i18n.t('common.group')}
      items={groups}
      itemKeyProp={AuthGroup.keys.uuid}
      itemLabelFunction={group => i18n.t(`authGroups.${AuthGroup.getName(group)}.label_plural`)}
      selection={groups.find(group => AuthGroup.getUuid(group) === groupUuid)}
      onChange={group => onChange(AuthGroup.getUuid(group))}
      readOnlyInput={true}
    />
  )
}

DropdownUserGroup.defaultProps = {
  editingSelfUser: false, // True if user being edited is the logged one
  groupUuid: null,
  disabled: false,
  validation: null,
  onChange: null,
}

export default DropdownUserGroup
