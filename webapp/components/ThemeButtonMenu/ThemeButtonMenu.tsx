import { useCallback, useMemo } from 'react'

import { IconName } from '@webapp/components/AppIcon'
import { ButtonMenu, type ButtonMenuItem } from '@webapp/components/buttons'
import { type ThemePreference, themePreferences } from '@webapp/theme/themeMode'
import { useThemeMode } from '@webapp/theme/useThemeMode'
import { TestId } from '@webapp/utils/testId'

const iconByPreference: Record<ThemePreference, IconName> = {
  light: 'themeLight',
  dark: 'themeDark',
  system: 'themeSystem',
}

/**
 * Header menu to switch between the light, dark and system (OS defined) theme; its icon shows the current one.
 *
 * @returns {React.ReactElement} The theme switcher button menu.
 */
export const ThemeButtonMenu = () => {
  const { preference, setPreference } = useThemeMode()

  const items: ButtonMenuItem[] = useMemo(
    () =>
      Object.values(themePreferences).map((key) => ({
        key,
        iconName: iconByPreference[key],
        iconSize: 18,
        label: `header.theme.${key}`,
        testId: TestId.header.themeItem(key),
      })),
    []
  )

  const onItemClick = useCallback((item: ButtonMenuItem) => setPreference(item.key as ThemePreference), [setPreference])

  return (
    <ButtonMenu
      iconName={iconByPreference[preference]}
      iconSize={16}
      items={items}
      onItemClick={onItemClick}
      selectedItemKey={preference}
      testId={TestId.header.themeBtn}
      title="header.theme.label"
      variant="text"
    />
  )
}
