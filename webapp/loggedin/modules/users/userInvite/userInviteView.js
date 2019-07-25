import './userInviteView.scss'

import * as R from 'ramda'

import React, { useState, useEffect } from 'react'

import { groupNames } from '../../../../../common/auth/authGroups'

import useI18n from '../../../../commonComponents/useI18n'

import { Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

const UserInviteView = () => {
  const i18n = useI18n()

  const groups = R.keys(groupNames)

  const [email, setEmail] = useState('')
  const [group, setGroup] = useState()

  return (
    <div className="user-invite">
      <div>
        <Input
          placeholder={i18n.t('common.email')}
          value={email}
          onChange={setEmail}/>
      </div>
      <div>
        <Dropdown
          placeholder={i18n.t('usersView.group')}
          items={groups}
          selection={group}
          onChange={setGroup}/>
      </div>
      <button className="btn"
              onClick={() => alert('ecchice')}>
        <span className="icon icon-plus icon-left icon-12px" />
        {i18n.t('usersView.inviteUser')}
      </button>
    </div>
  )
}

export default UserInviteView
