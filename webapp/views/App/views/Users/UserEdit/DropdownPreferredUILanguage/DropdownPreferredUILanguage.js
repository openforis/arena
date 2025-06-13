import { getLanguageLabel } from '@core/app/languages'
import { supportedLanguages } from '@core/i18n/i18nFactory'
import * as User from '@core/user/user'

import { Dropdown } from '@webapp/components/form'

const emptyItemValue = '---'

const items = [
  { value: emptyItemValue, label: 'user.preferredUILanguage.auto' },
  ...supportedLanguages.map((lang) => ({
    value: lang,
    label: getLanguageLabel(lang),
  })),
]

export const DropdownPreferredUILanguage = (props) => {
  const { user, onChange, validation = {}, disabled = false } = props
  const i18n = useI18n()

  const userPreferredLanguageCode = User.getPreferredUILanguage(user)
  const selectedLanguage = userPreferredLanguageCode ? userPreferredLanguageCode : emptyItemValue

  return (
    <Dropdown
      disabled={disabled}
      placeholder={i18n.t('user.preferredUILanguage.placeholder')}
      onChange={onChange}
      items={items}
      selection={items.find((item) => item.value === selectedLanguage)}
      validation={validation}
    />
  )
}
