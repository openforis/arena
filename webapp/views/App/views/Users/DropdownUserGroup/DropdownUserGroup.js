import React from 'react'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import Dropdown from '@webapp/components/form/Dropdown'

const DropdownUserGroup = (props) => {
  const {
    disabled = false,
    editingLoggedUser = false, // True if user being edited is the logged one
    groupUuid = null,
    onChange,
    showOnlySurveyGroups = false,
    validation,
  } = props

  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  const groups = Authorizer.getUserGroupsCanAssign({ user, surveyInfo, editingLoggedUser, showOnlySurveyGroups })

  return (
    <Dropdown
      disabled={disabled}
      items={groups}
      itemValue={AuthGroup.keys.uuid}
      itemLabel={(group) => i18n.t(`authGroups.${AuthGroup.getName(group)}.label_plural`)}
      onChange={(group) => onChange(group)}
      placeholder={i18n.t('common.group')}
      selection={groups.find((group) => AuthGroup.getUuid(group) === groupUuid)}
      searchable={false}
      testId={TestId.userInvite.group}
      validation={validation}
    />
  )
}

DropdownUserGroup.propTypes = {
  editingLoggedUser: PropTypes.any,
  groupUuid: PropTypes.any,
  disabled: PropTypes.bool,
  validation: PropTypes.any,
  onChange: PropTypes.func,
  showOnlySurveyGroups: PropTypes.bool,
}

export default DropdownUserGroup
