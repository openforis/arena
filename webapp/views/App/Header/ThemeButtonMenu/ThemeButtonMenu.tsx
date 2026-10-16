import React, { useCallback, useMemo } from 'react'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined'

import { ButtonMenu, type ButtonMenuItem } from '@webapp/components/buttons'
import { themePreferences, type ThemePreference } from '@webapp/theme/themeMode'
import { useThemeMode } from '@webapp/theme/useThemeMode'
import { TestId } from '@webapp/utils/testId'

const iconSx = { mr: 1 }

const iconByPreference: Record<ThemePreference, React.ReactNode> = {
  light: <LightModeOutlined fontSize="small" sx={iconSx} />,
  dark: <DarkModeOutlined fontSize="small" sx={iconSx} />,
  system: <SettingsBrightnessOutlined fontSize="small" sx={iconSx} />,
}

/**
 * Header menu to switch between the light, dark and system (OS defined) theme.
 *
 * @returns {React.ReactElement} The theme switcher button menu.
 */
export const ThemeButtonMenu = () => {
  const { preference, setPreference } = useThemeMode()

  const items: ButtonMenuItem[] = useMemo(
    () =>
      Object.values(themePreferences).map((key) => ({
        key,
        icon: iconByPreference[key],
        label: `header.theme.${key}`,
        testId: TestId.header.themeItem(key),
      })),
    []
  )

  const onItemClick = useCallback((item: ButtonMenuItem) => setPreference(item.key as ThemePreference), [setPreference])

  return (
    <ButtonMenu
      iconClassName="icon-contrast icon-16px"
      items={items}
      onItemClick={onItemClick}
      selectedItemKey={preference}
      testId={TestId.header.themeBtn}
      title="header.theme.label"
      variant="text"
    />
  )
}
