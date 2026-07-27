import './Landing.scss'

import React from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import type { BrandingImageDescriptor, SurveyLogoKey } from '@core/survey/surveyBranding'

import { appModuleUri, dataModules, appModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components'
import { useBrandingLogoSrc } from '@webapp/components/survey/useBrandingLogoSrc'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyId, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

type LandingLogoProps = {
  surveyId: number | string | null
  logo: BrandingImageDescriptor
  logoKey: SurveyLogoKey
}

const LandingLogo = (props: LandingLogoProps) => {
  const { surveyId, logo, logoKey } = props
  const src = useBrandingLogoSrc({ surveyId, logo })

  if (!src) return null

  return <img alt="" className="survey-landing__logo" data-logo-slot={logoKey} src={src} />
}

const LandingContent = () => {
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const title = Survey.getLabel(surveyInfo, lang)
  const description = Survey.getDescription(lang, '')(surveyInfo)
  const branding = SurveyBranding.getBranding(surveyInfo)
  const landingBackgroundSrc = useBrandingLogoSrc({
    surveyId,
    logo: SurveyBranding.getLandingBackground(surveyInfo),
  })

  return (
    <div
      className={classNames('survey-landing', {
        'survey-landing--with-background': Boolean(landingBackgroundSrc),
      })}
      style={landingBackgroundSrc ? { backgroundImage: `url(${landingBackgroundSrc})` } : undefined}
    >
      <div className="survey-landing__content">
        <div className="survey-landing__logos">
          {SurveyBranding.surveyLogoKeys.map((logoKey) => {
            const logo = branding[logoKey]
            if (!logo || !SurveyBranding.hasLogoDescriptor(logo)) return null
            return <LandingLogo key={logoKey} logo={logo} logoKey={logoKey} surveyId={surveyId} />
          })}
        </div>
        <h1 className="survey-landing__title" style={{ fontSize: SurveyBranding.getTitleFontSizeRem(surveyInfo) }}>
          {title}
        </h1>
        {description ? (
          <p
            className="survey-landing__description"
            style={{ fontSize: SurveyBranding.getDescriptionFontSizeRem(surveyInfo) }}
          >
            {description}
          </p>
        ) : null}
        <div className="survey-landing__actions">
          <Button
            primary
            label="common:appModules.records"
            onClick={() => navigate(appModuleUri(dataModules.records))}
          />
          <Button label="homeView:landing.openDashboard" onClick={() => navigate(appModuleUri(appModules.dashboard))} />
        </div>
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
