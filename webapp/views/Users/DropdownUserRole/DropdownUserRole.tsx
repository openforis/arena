import * as AuthGroup from '@core/auth/authGroup'
import { Authorizer } from '@openforis/arena-core'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import Dropdown from '@webapp/components/form/Dropdown'

type DropdownUserRoleProps = {
  groupUuid?: any
  disabled?: boolean
  validation?: any
  onChange?: (...args: any[]) => any
  showOnlySurveyGroups?: boolean
}

const DropdownUserRole = (props: DropdownUserRoleProps) => {
  const { disabled = false, groupUuid = null, onChange, showOnlySurveyGroups = false, validation } = props

  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  const groups = Authorizer.getUserGroupsCanAssign({ user, surveyInfo, showOnlySurveyGroups })

  return (
    <Dropdown
      disabled={disabled}
      items={groups}
      itemValue={AuthGroup.keys.uuid}
      itemLabel={(group) => i18n.t(`auth:authGroups.${AuthGroup.getName(group)}.label`)}
      onChange={(group) => onChange(group)}
      placeholder={i18n.t('common.role')}
      selection={groups.find((group) => AuthGroup.getUuid(group) === groupUuid)}
      searchable={false}
      testId={TestId.userInvite.group}
      validation={validation}
    />
  )
}

export default DropdownUserRole
