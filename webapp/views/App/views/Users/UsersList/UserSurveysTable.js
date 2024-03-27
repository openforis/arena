import React, { useEffect, useState } from 'react'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import LoadingBar from '@webapp/components/LoadingBar'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

export const UserSurveysTable = (props) => {
  const { user } = props

  const [state, setState] = useState({ loading: true, surveys: [] })
  const i18n = useI18n()

  useEffect(() => {
    ;(async () => {
      const { surveys: surveysLoaded } = await API.fetchUserSurveys({ userUuid: user.uuid })
      setState({ surveys: surveysLoaded, loading: false })
    })()
  }, [])

  const { loading, surveys } = state

  if (loading) {
    return <LoadingBar />
  }

  if (surveys.length === 0) {
    return <div>{i18n.t('usersView.userNotInvitedToAnySurvey')}</div>
  }

  const gridTemplateColumns = '45rem 15rem'

  return (
    <fieldset className="users-surveys-fieldset">
      <legend>{i18n.t('usersView.userSurveys')}</legend>
      <div className="table">
        <div className="table__content">
          <div className="table__row-header" style={{ gridTemplateColumns }}>
            <div className="table__cell">{i18n.t('usersView.surveyName')}</div>
            <div className="table__cell">{i18n.t('usersView.roleInSurvey')}</div>
          </div>
          <div className="table__rows">
            {surveys.map((survey) => {
              const surveyInfo = Survey.getSurveyInfo(survey)
              const surveyUuid = Survey.getUuid(surveyInfo)
              const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
              const authGroupName = AuthGroup.getName(authGroup)
              const authGroupLabel = authGroupName ? i18n.t(`authGroups.${authGroupName}.label`) : ''

              return (
                <div className="table__row" key={surveyUuid} style={{ gridTemplateColumns }}>
                  <div className="table__cell">{Survey.getName(surveyInfo)}</div>
                  <div className="table__cell">{authGroupLabel}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </fieldset>
  )
}
