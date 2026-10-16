import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { getLanguageLabel } from '@core/app/languages'
import { supportedLanguages } from '@core/i18n/i18nFactory'

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
        label: getLanguageLabel(langCode),
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
      iconClassName="icon-earth icon-16px"
      items={items}
      label={getLanguageLabel(i18n.language)}
      labelIsI18nKey={false}
      onItemClick={onItemClick}
      selectedItemKey={i18n.language}
      testId={TestId.guest.languageBtn}
      title="common.language"
      variant="text"
    />
  )
}
