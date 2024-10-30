import React, { useCallback, useState } from 'react'

import * as User from '@core/user/user'

import { UserAuthGroupExtraPropsEditor } from '../../UserEdit/UserAuthGroupExtraPropsEditor'
import { useOnSave } from '../../UserEdit/store/actions/useOnSave'
import { ButtonSave, PanelRight } from '@webapp/components'

export const SurveyUserExtraPropsEditor = (props) => {
  const { onClose, userToUpdate } = props

  const [userUpdated, setUserUpdated] = useState(userToUpdate)
  const saveUser = useOnSave({ userToUpdate })

  const onSurveyExtraPropsChange = useCallback(
    (extraPropsNew) => {
      const userUpdated = User.assocAuthGroupExtraProps(extraPropsNew)(userToUpdate)
      setUserUpdated(userUpdated)
    },
    [userToUpdate]
  )

  const onSave = useCallback(() => {
    saveUser(userUpdated)
  }, [saveUser, userUpdated])

  return (
    <PanelRight
      className="survey-user-extra-props"
      header="usersView.editSurveyUserExtraPropsForUser"
      headerParams={{ userName: User.getName(userToUpdate) ?? User.getEmail(userToUpdate) }}
      onClose={onClose}
      width="55rem"
    >
      <UserAuthGroupExtraPropsEditor onChange={onSurveyExtraPropsChange} userToUpdate={userUpdated} />
      <ButtonSave onClick={onSave} />
    </PanelRight>
  )
}
