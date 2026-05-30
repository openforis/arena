import './ActiveSurveyNotSelected.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'

import * as Authorizer from '@core/auth/authorizer'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { NotificationActions } from '@webapp/store/ui'
import { useAuthIsMaxSurveysCountReached, useUser } from '@webapp/store/user/hooks'

export const ActiveSurveyNotSelected = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const isMaxSurveysCountReached = useAuthIsMaxSurveysCountReached()

  const onNewSurveyClick = useCallback(
    (e) => {
      if (isMaxSurveysCountReached) {
        e.preventDefault()
        const maxSurveysCount = Authorizer.getMaxSurveysUserCanCreate(user)
        dispatch(
          NotificationActions.notifyError({
            key: 'surveyCreate:errorMaxSurveysCountExceeded',
            params: { maxSurveysCount },
          })
        )
      }
    },
    [isMaxSurveysCountReached, user, dispatch]
  )

  return (
    <div className="active-survey-not-selected">
      <Trans
        i18nKey="homeView:dashboard.activeSurveyNotSelected"
        components={{
          title: <h2 />,
          label: <span />,
          linkToSurveys: <Link to={appModuleUri(homeModules.surveyList)} className="btn-s btn-transparent" />,
          linkToNewSurvey: (
            <Link
              to={appModuleUri(homeModules.surveyNew)}
              className="btn-s btn-transparent"
              onClick={onNewSurveyClick}
            />
          ),
        }}
      ></Trans>
    </div>
  )
}
