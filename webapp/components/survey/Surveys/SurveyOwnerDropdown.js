import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as User from '@core/user/user'

import { Dropdown } from '@webapp/components/form'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useUserIsSystemAdmin } from '@webapp/store/user'

const ownerLabelFunction = (user) => [User.getName(user), User.getEmail(user)].filter(Objects.isNotEmpty).join(' - ')

export const SurveyOwnerDropdown = (props) => {
  const { selectedUuid, onChange } = props

  const i18n = useI18n()
  const isSystemAdmin = useUserIsSystemAdmin()

  const [state, setState] = useState({ loading: true, users: [] })

  const { users } = state
  const selectedUser = useMemo(() => users.find((user) => User.getUuid(user) === selectedUuid), [selectedUuid, users])

  const fetchUsers = useCallback(async () => {
    const usersFetched = await API.fetchUsers({
      onlyAccepted: true,
      includeSystemAdmins: isSystemAdmin,
    })
    setState({ loading: false, users: usersFetched })
  }, [isSystemAdmin])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Dropdown
      className="width100"
      clearable={false}
      items={users}
      itemValue={User.keys.uuid}
      itemLabel={ownerLabelFunction}
      onChange={onChange}
      placeholder={i18n.t('common.owner')}
      selection={selectedUser}
    />
  )
}

SurveyOwnerDropdown.propTypes = {
  selectedUuid: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}
