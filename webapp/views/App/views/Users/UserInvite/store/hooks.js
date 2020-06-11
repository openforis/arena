import { useEffect, useReducer } from 'react'
import { useHistory } from 'react-router'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'
import axios from 'axios'

import * as UserInvite from '@core/user/userInvite'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import * as Validation from '@core/validation/validation'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import * as actions from './actions'
import reducer from './reducer'
import initialState from './initialState'

export const useInviteUser = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const dispatchRedux = useDispatch()
  const history = useHistory()

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  useEffect(() => {
    actions.resetUserInvite()(dispatch)
  }, [])

  const onUpdateUserInvite = ({ name, value }) => {
    const userInviteUpdated = UserInvite.assocProp(name, value)(state)
    actions.updateUserInvite({ userInviteUpdated })(dispatch)
  }

  const onInvite = () => {
    ;(async () => {
      const userInvite = state
      const userInviteValidated = await actions.validateUserInvite(userInvite)

      if (Validation.isObjValid(userInviteValidated)) {
        try {
          dispatchRedux(LoaderActions.showLoader())

          const userInviteParams = R.pipe(
            R.omit([UserInvite.keys.validation]),
            R.assoc('surveyCycleKey', surveyCycleKey)
          )(userInviteValidated)
          await axios.post(`/api/survey/${surveyId}/users/invite`, userInviteParams)

          dispatchRedux(
            NotificationActions.notifyInfo({
              key: 'common.emailSentConfirmation',
              params: { email: UserInvite.getEmail(userInvite) },
            })
          )

          history.push(appModuleUri(userModules.users))
        } finally {
          dispatchRedux(LoaderActions.hideLoader())
        }
      }
    })()
  }
  return {
    userInvite: state,
    onUpdateUserInvite,
    onInvite,
  }
}
