import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'
import * as User from '@core/user/user'

import { ButtonMenu } from '@webapp/components'
import { useI18n } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'
import { useBrowserLanguageCode } from '@webapp/components/hooks'

const autoLanguageKey = '__auto__'

export const PreferredUILanguageButtonMenu = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const user = useUser()
  const preferredLanguageCode = User.getPrefLanguage(user)
  const browserLanguageCode = useBrowserLanguageCode()

  const onItemClick = useCallback(
    (item) => {
      const preferredLangNext = item.key === autoLanguageKey ? null : item.key
      const userUpdated = User.assocPrefLanguage({ lang: preferredLangNext })(user)
      dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
      i18n.changeLanguage(preferredLangNext ?? defaultLanguage)
    },
    [dispatch, i18n, user]
  )

  const items = useMemo(() => {
    const detectedLanguageCode = supportedLanguages.includes(browserLanguageCode)
      ? browserLanguageCode
      : defaultLanguage
    return [
      {
        key: autoLanguageKey,
        content: i18n.t('userView.preferredUILanguage.auto', {
          detectedLanguage: getLanguageLabel(detectedLanguageCode),
        }),
      },
      ...supportedLanguages.map((langCode) => ({
        key: langCode,
        content: getLanguageLabel(langCode),
      })),
    ]
  }, [i18n, browserLanguageCode])

  return (
    <ButtonMenu
      iconClassName="icon-earth icon-16px"
      items={items}
      onItemClick={onItemClick}
      selectedItemKey={preferredLanguageCode ?? autoLanguageKey}
      title="userView.preferredUILanguage.label"
      variant="text"
    />
  )
}
