import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getLanguageEndonym } from '@core/app/languages'
import { supportedLanguages } from '@core/i18n/uiLanguages'
import { ButtonMenu, type ButtonMenuItem } from '@webapp/components/buttons'
import { UILanguageStorage } from '@webapp/service/storage/uiLanguage'
import { TestId } from '@webapp/utils/testId'

/**
 * Menu to choose the UI language when no user is logged in (the choice is stored in the browser).
 *
 * @returns {React.ReactElement} The language button menu.
 */
export const GuestLanguageButtonMenu = () => {
  const { i18n } = useTranslation()

  const items: ButtonMenuItem[] = useMemo(
    () =>
      supportedLanguages.map((langCode) => ({
        key: langCode,
        label: getLanguageEndonym(langCode),
        labelIsI18nKey: false,
        testId: TestId.guest.languageItem(langCode),
      })),
    []
  )

  const onItemClick = useCallback(
    (item: ButtonMenuItem) => {
      UILanguageStorage.setUILanguage(item.key)
      i18n.changeLanguage(item.key)
    },
    [i18n]
  )

  return (
    <ButtonMenu
      iconName="translate"
      iconSize={16}
      items={items}
      label={getLanguageEndonym(i18n.language)}
      labelIsI18nKey={false}
      onItemClick={onItemClick}
      selectedItemKey={i18n.language}
      testId={TestId.guest.languageBtn}
      title="common.language"
      variant="text"
    />
  )
}
