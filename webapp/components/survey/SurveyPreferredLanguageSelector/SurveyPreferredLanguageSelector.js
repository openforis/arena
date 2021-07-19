import React from 'react'

import * as User from '@core/user/user'
import { getLanguageLabel } from '@core/app/languages'

import Dropdown from '@webapp/components/form/Dropdown'

import { useSurveyId, useSurveyLangs, useSurveyPreferredLang } from '@webapp/store/survey'
import { UserActions, useUser } from '@webapp/store/user'
import { useDispatch } from 'react-redux'
import { useI18n } from '@webapp/store/system'

export const SurveyPreferredLanguageSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const preferredLang = useSurveyPreferredLang()
  const surveyId = useSurveyId()
  const langs = useSurveyLangs()
  const user = useUser()

  if (langs.length === 1) {
    // only one language: no need for a selector, it will be selected by default
    return null
  }

  const langToDropdownItem = (lang) => ({ key: lang, value: getLanguageLabel(lang) })
  const dropdownItems = langs.map(langToDropdownItem)
  const selection = langToDropdownItem(preferredLang)

  return (
    <Dropdown
      className="survey-preferred-language"
      items={dropdownItems}
      selection={selection}
      onChange={(langItem) => {
        const { key: lang } = langItem
        const userUpdated = User.assocPrefSurveyLang({ surveyId, lang })(user)
        dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
      }}
      title={`${i18n.t('homeView.surveyInfo.preferredLanguage')} (${selection.value})`}
    />
  )
}
