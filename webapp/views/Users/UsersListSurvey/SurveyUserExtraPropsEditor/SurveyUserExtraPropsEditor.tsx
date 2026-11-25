import { useCallback, useMemo, useState } from 'react'

import * as User from '@core/user/user'
import { PanelRight } from '@webapp/components'
import { useOnValueChange } from '@webapp/components/hooks'
import { useSurveyUuid } from '@webapp/store/survey/hooks'
import { UserAuthGroupExtraPropsEditor } from '../../UserEdit/UserAuthGroupExtraPropsEditor'

import { useOnSaveExtraProps } from './useOnSaveExtraProps'

const buildUserUpdated = ({ surveyUuid, userToUpdate }) => {
  const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
  const groupExtraProps = groupInCurrentSurvey?.props?.extra
  return User.assocAuthGroupExtraProps(groupExtraProps)(userToUpdate)
}

type SurveyUserExtraPropsEditorProps = {
  onClose: (...args: any[]) => any
  onUserUpdate: (...args: any[]) => any
  userToUpdate: Record<string, any>
}

export const SurveyUserExtraPropsEditor = (props: SurveyUserExtraPropsEditorProps) => {
  const { onClose, onUserUpdate, userToUpdate } = props

  const surveyUuid = useSurveyUuid()
  const userInitial = useMemo(() => buildUserUpdated({ surveyUuid, userToUpdate }), [surveyUuid, userToUpdate])
  const [userUpdated, setUserUpdated] = useState(userInitial)
  const saveUser = useOnSaveExtraProps({ userToUpdate: userUpdated })

  useOnValueChange(userInitial, setUserUpdated)

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
