import React, { useCallback, useEffect, useMemo, useState } from 'react'

import * as User from '@core/user/user'

import { Dropdown } from '@webapp/components/form'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUserIsSystemAdmin } from '@webapp/store/user'

export const RecordOwnerDropdown = (props) => {
  const { selectedUuid, onChange } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const isSystemAdmin = useUserIsSystemAdmin()

  const [state, setState] = useState({ loading: true, users: [] })

  const { users } = state
  const selectedUser = useMemo(() => users.find((user) => User.getUuid(user) === selectedUuid), [selectedUuid, users])

  const fetchUsers = useCallback(async () => {
    const usersFetched = await API.fetchUsersBySurvey({
      surveyId,
      onlyAccepted: true,
      includeSystemAdmins: isSystemAdmin,
    })
    setState({ loading: false, users: usersFetched })
  }, [isSystemAdmin, surveyId])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Dropdown
      items={users}
      itemValue={User.keys.uuid}
      itemLabel={(user) => User.getName(user) ?? User.getEmail(user)}
      onChange={onChange}
      placeholder={i18n.t('common.owner')}
      selection={selectedUser}
    />
  )
}
