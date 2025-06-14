import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'
import * as User from '@core/user/user'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'

const emptyItemValue = '---'

const getItems = ({ i18n }) => {
  const browserLanguage = navigator.language ?? defaultLanguage
  const detectedLanguageCode = supportedLanguages.includes(browserLanguage) ? browserLanguage : defaultLanguage
  const detectedLanguage = getLanguageLabel(detectedLanguageCode)
  return [
    { value: emptyItemValue, label: i18n.t('userView.preferredUILanguage.auto', { detectedLanguage }) },
    ...supportedLanguages.map((lang) => ({
      value: lang,
      label: getLanguageLabel(lang),
    })),
  ]
}

export const DropdownPreferredUILanguage = (props) => {
  const { user, onChange } = props
  const dispatch = useDispatch()
  const i18n = useI18n()
  const currentUser = useUser()
  const items = getItems({ i18n })

  const userPreferredLang = User.getPrefLanguage(user)
  const selectedLanguage = userPreferredLang ?? emptyItemValue

  return (
    <Dropdown
      onChange={(langItem) => {
        const { value: lang } = langItem
        const languageToSet = lang === emptyItemValue ? null : lang
        const userUpdated = User.assocPrefLanguage({ lang: languageToSet })(user)
        dispatch(UserActions.updateUserPrefs({ user: userUpdated }))

        if (User.isEqual(currentUser)(user)) {
          i18n.changeLanguage(languageToSet ?? defaultLanguage)
        }
        onChange(userUpdated)
      }}
      items={items}
      selection={items.find((item) => item.value === selectedLanguage)}
    />
  )
}

DropdownPreferredUILanguage.propTypes = {
  user: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}
