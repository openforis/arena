import { useCallback, useMemo } from 'react'

import { getLanguageEndonym, getLanguageLabel } from '@core/app/languages'
import { supportedLanguages } from '@core/i18n/uiLanguages'
import * as User from '@core/user/user'
import { ButtonMenu } from '@webapp/components'
import { useAppDispatch } from '@webapp/store'
import { detectUILanguage, useI18n } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

const autoLanguageKey = '__auto__'

export const PreferredUILanguageButtonMenu = () => {
  const dispatch = useAppDispatch()
  const i18n = useI18n()
  const user = useUser()
  const preferredLanguageCode = User.getPrefLanguage(user)
  const detectedLanguageCode = useMemo(() => detectUILanguage(), [])

  const onItemClick = useCallback(
    async (item) => {
      const preferredLangNext = item.key === autoLanguageKey ? null : item.key
      // the language is loaded when first used: the UI is updated (re-rendered by the prefs update) once it is set
      await i18n.changeLanguage(preferredLangNext ?? detectedLanguageCode)
      const userUpdated = User.assocPrefLanguage({ lang: preferredLangNext })(user)
      dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
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
        label: getLanguageEndonym(langCode),
        labelIsI18nKey: false,
        testId: TestId.header.uiLanguageItem(langCode),
      })),
    ]
  }, [detectedLanguageCode])

  return (
    <ButtonMenu
      // the label is only the language code: the accessible name is the title
      aria-label={i18n.t('userView.preferredUILanguage.label')}
      iconName="translate"
      iconSize={16}
      items={items}
      // the current language code next to the icon, e.g. "EN"
      label={i18n.language.toUpperCase()}
      labelIsI18nKey={false}
      onItemClick={onItemClick}
      selectedItemKey={preferredLanguageCode ?? autoLanguageKey}
      testId={TestId.header.uiLanguageBtn}
      title="userView.preferredUILanguage.label"
      variant="text"
    />
  )
}
