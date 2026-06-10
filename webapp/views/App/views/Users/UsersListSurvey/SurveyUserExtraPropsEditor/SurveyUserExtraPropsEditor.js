import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'

import { PanelRight } from '@webapp/components'

import { useSurveyUuid } from '@webapp/store/survey/hooks'

import { UserAuthGroupExtraPropsEditor } from '../../UserEdit/UserAuthGroupExtraPropsEditor'
import { useOnSaveExtraProps } from './useOnSaveExtraProps'

const buildUserUpdated = ({ surveyUuid, userToUpdate }) => {
  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
  const groupExtraProps = groupInCurrentSurvey?.props?.extra
  return User.assocAuthGroupExtraProps(groupExtraProps)(userToUpdate)
}

export const SurveyUserExtraPropsEditor = (props) => {
  const { onClose, onUserUpdate, userToUpdate } = props

  const surveyUuid = useSurveyUuid()
  const [userUpdated, setUserUpdated] = useState(() => buildUserUpdated({ surveyUuid, userToUpdate }))
  const saveUser = useOnSaveExtraProps({ userToUpdate: userUpdated })

  // Update userUpdated when userToUpdate or surveyUuid changes
  useEffect(() => {
    setUserUpdated(buildUserUpdated({ surveyUuid, userToUpdate }))
  }, [surveyUuid, userToUpdate])

  const onSurveyExtraPropsChange = useCallback((extraPropsNew) => {
    setUserUpdated((userPrev) => User.assocAuthGroupExtraProps(extraPropsNew)(userPrev))
  }, [])

  const onSave = useCallback(async () => {
    await saveUser()
    onUserUpdate(userUpdated)
  }, [onUserUpdate, saveUser, userUpdated])

  return (
    <PanelRight
      className="survey-user-extra-props"
      header="usersView:editSurveyUserExtraPropsForUser"
      headerParams={{ userName: User.getName(userToUpdate) ?? User.getEmail(userToUpdate) }}
      onClose={onClose}
      width="55rem"
    >
      <UserAuthGroupExtraPropsEditor onChange={onSurveyExtraPropsChange} onSave={onSave} userToUpdate={userUpdated} />
    </PanelRight>
  )
}

SurveyUserExtraPropsEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUserUpdate: PropTypes.func.isRequired,
  userToUpdate: PropTypes.object.isRequired,
}
