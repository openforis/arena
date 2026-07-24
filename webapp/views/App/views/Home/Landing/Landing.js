import './Landing.scss'

import React from 'react'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'

import { appModuleUri, dataModules, appModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components'
import { useBrandingLogoSrc } from '@webapp/components/survey/useBrandingLogoSrc'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyId, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

const LandingContent = () => {
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const title = Survey.getLabel(surveyInfo, lang)
  const description = Survey.getDescription(lang, '')(surveyInfo)
  const surveyLogoSrc = useBrandingLogoSrc({
    surveyId,
    logo: SurveyBranding.getSurveyLogo(surveyInfo),
  })
  const countryLogoSrc = useBrandingLogoSrc({
    surveyId,
    logo: SurveyBranding.getCountryLogo(surveyInfo),
  })

  return (
    <div className="survey-landing">
      <div className="survey-landing__logos">
        {countryLogoSrc && (
          <img alt="" className="survey-landing__logo survey-landing__logo--country" src={countryLogoSrc} />
        )}
        {surveyLogoSrc && (
          <img alt="" className="survey-landing__logo survey-landing__logo--survey" src={surveyLogoSrc} />
        )}
      </div>
      <h1 className="survey-landing__title">{title}</h1>
      {description ? <p className="survey-landing__description">{description}</p> : null}
      <div className="survey-landing__actions">
        <Button primary label="homeView:landing.enter" onClick={() => navigate(appModuleUri(dataModules.records))} />
        <Button label="homeView:landing.openDashboard" onClick={() => navigate(appModuleUri(appModules.dashboard))} />
      </div>
    </div>
  )
}

const Landing = () => {
  const canEditSurvey = useAuthCanEditSurvey()

  return (
    <SurveyDefsLoader draft={canEditSurvey}>
      <LandingContent />
    </SurveyDefsLoader>
  )
}

export default Landing
