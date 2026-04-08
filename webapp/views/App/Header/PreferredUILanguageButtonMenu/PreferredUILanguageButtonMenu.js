import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'
import * as User from '@core/user/user'

import { ButtonMenu } from '@webapp/components'
import { useBrowserLanguageCode } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'

const autoLanguageKey = '__auto__'

export const PreferredUILanguageButtonMenu = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const user = useUser()
  const preferredLanguageCode = User.getPrefLanguage(user)
  const browserLanguageCode = useBrowserLanguageCode()

  const detectedLanguageCode = useMemo(
    () => (supportedLanguages.includes(browserLanguageCode) ? browserLanguageCode : defaultLanguage),
    [browserLanguageCode]
  )

  const onItemClick = useCallback(
    (item) => {
      const preferredLangNext = item.key === autoLanguageKey ? detectedLanguageCode : item.key
      const userUpdated = User.assocPrefLanguage({ lang: preferredLangNext })(user)
      dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
      i18n.changeLanguage(preferredLangNext)
    },
    [dispatch, i18n, user, detectedLanguageCode]
  )

  const items = useMemo(() => {
    return [
      {
        key: autoLanguageKey,
        label: 'userView.preferredUILanguage.auto',
        labelParams: {
          detectedLanguage: getLanguageLabel(detectedLanguageCode),
        },
      },
      ...supportedLanguages.map((langCode) => ({
        key: langCode,
        label: getLanguageLabel(langCode),
        labelIsI18nKey: false,
      })),
    ]
  }, [detectedLanguageCode])

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
