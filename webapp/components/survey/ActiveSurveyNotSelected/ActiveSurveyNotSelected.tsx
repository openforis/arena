import './ActiveSurveyNotSelected.scss'

import { Trans } from 'react-i18next'
import { Link } from 'react-router'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { TransTitle } from '@webapp/components/TransTitle'
import { useOnNewSurveyClick } from '@webapp/store/user/hooks'

export const ActiveSurveyNotSelected = () => {
  const onNewSurveyClick = useOnNewSurveyClick()

  return (
    <div className="active-survey-not-selected">
      <Trans
        i18nKey="homeView:dashboard.activeSurveyNotSelected"
        components={{
          title: <TransTitle />,
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
