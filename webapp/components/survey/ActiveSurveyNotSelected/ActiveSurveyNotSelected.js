import './ActiveSurveyNotSelected.scss'

import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useOnNewSurveyClick } from '@webapp/store/user/hooks'

export const ActiveSurveyNotSelected = () => {
  const onNewSurveyClick = useOnNewSurveyClick()

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
