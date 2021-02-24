import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { DataTestId } from '@webapp/utils/dataTestId'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import Dropdown from '@webapp/components/form/Dropdown'

const DropdownUserGroup = (props) => {
  const { editingLoggedUser, groupUuid, disabled, validation, onChange } = props

  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  let surveyGroups
  if (editingLoggedUser && !surveyInfo) {
    // This can happen for system administrators when they don't have an active survey
    surveyGroups = []
  } else if (Survey.isPublished(surveyInfo)) {
    surveyGroups = Survey.getAuthGroups(surveyInfo)
  } else {
    surveyGroups = [Survey.getAuthGroupAdmin(surveyInfo)]
  }

  // Add SystemAdmin group if current user is a SystemAdmin himself
  const groups = R.when(R.always(User.isSystemAdmin(user)), R.concat(User.getAuthGroups(user)))(surveyGroups)

  return (
    <Dropdown
      idInput={DataTestId.userList.group}
      disabled={disabled}
      validation={validation}
      placeholder={i18n.t('common.group')}
      items={groups}
      itemKey={AuthGroup.keys.uuid}
      itemLabel={(group) => i18n.t(`authGroups.${AuthGroup.getName(group)}.label_plural`)}
      selection={groups.find((group) => AuthGroup.getUuid(group) === groupUuid)}
      onChange={(group) => onChange(AuthGroup.getUuid(group))}
      readOnlyInput
    />
  )
}

DropdownUserGroup.defaultProps = {
  editingLoggedUser: false, // True if user being edited is the logged one
  groupUuid: null,
  disabled: false,
  validation: null,
  onChange: null,
}

DropdownUserGroup.propTypes = {
  editingLoggedUser: PropTypes.any,
  groupUuid: PropTypes.any,
  disabled: PropTypes.bool,
  validation: PropTypes.any,
  onChange: PropTypes.func,
}

export default DropdownUserGroup
