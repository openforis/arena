import type { ReactElement } from 'react'
import { ListItemIcon, ListItemText, ListSubheader, MenuItem } from '@mui/material'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

type MenuActionItemProps = {
  itemKey: string
  labelKey: string
  disabled?: boolean
  onClick: () => void
}

/**
 * Menu item that runs an action; the caller closes the menu when the action opens a dialog or starts a tool.
 * @param {object} props - Component props.
 * @param {string} props.itemKey - Item key (test id suffix).
 * @param {string} props.labelKey - I18n key of the label.
 * @param {boolean} [props.disabled] - Whether the item is disabled.
 * @param {Function} props.onClick - Action.
 * @returns {React.ReactElement} The item.
 */
export const MenuActionItem = ({ itemKey, labelKey, disabled = false, onClick }: MenuActionItemProps): ReactElement => {
  const t = useI18nT()
  return (
    <MenuItem dense disabled={disabled} onClick={onClick} data-testid={TestId.mapWorkspace.menuItem(itemKey)}>
      <ListItemText>{t(labelKey)}</ListItemText>
    </MenuItem>
  )
}

type MenuCheckItemProps = {
  itemKey: string
  labelKey: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/**
 * Menu item with a check box; the menu stays open.
 * @param {object} props - Component props.
 * @param {string} props.itemKey - Item key (test id suffix).
 * @param {string} props.labelKey - I18n key of the label.
 * @param {boolean} props.checked - Whether it is checked.
 * @param {boolean} [props.disabled] - Whether the item is disabled.
 * @param {Function} props.onChange - Called with the new checked value.
 * @returns {React.ReactElement} The item.
 */
export const MenuCheckItem = ({
  itemKey,
  labelKey,
  checked,
  disabled = false,
  onChange,
}: MenuCheckItemProps): ReactElement => {
  const t = useI18nT()
  return (
    <MenuItem
      dense
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      data-testid={TestId.mapWorkspace.menuItem(itemKey)}
    >
      <ListItemIcon>
        <span
          className={`icon icon-14px ${checked ? 'icon-checkbox-checked' : 'icon-checkbox-unchecked'}`}
          aria-hidden="true"
        />
      </ListItemIcon>
      <ListItemText>{t(labelKey)}</ListItemText>
    </MenuItem>
  )
}

type MenuRadioItemProps = {
  itemKey: string
  label: string
  checked: boolean
  onSelect: () => void
}

/**
 * Menu item of a single-choice group (label already translated, e.g. a base map name).
 * @param {object} props - Component props.
 * @param {string} props.itemKey - Item key (test id suffix).
 * @param {string} props.label - Label.
 * @param {boolean} props.checked - Whether it is the selected choice.
 * @param {Function} props.onSelect - Called when chosen.
 * @returns {React.ReactElement} The item.
 */
export const MenuRadioItem = ({ itemKey, label, checked, onSelect }: MenuRadioItemProps): ReactElement => (
  <MenuItem
    dense
    role="menuitemradio"
    aria-checked={checked}
    selected={checked}
    onClick={onSelect}
    data-testid={TestId.mapWorkspace.menuItem(itemKey)}
  >
    <ListItemIcon>
      <span
        className={`icon icon-14px ${checked ? 'icon-radio-checked' : 'icon-radio-unchecked'}`}
        aria-hidden="true"
      />
    </ListItemIcon>
    <ListItemText>{label}</ListItemText>
  </MenuItem>
)

/**
 * Non-focusable section header inside a menu.
 * @param {object} props - Component props.
 * @param {string} props.labelKey - I18n key of the header.
 * @returns {React.ReactElement} The header.
 */
export const MenuSectionHeader = ({ labelKey }: { labelKey: string }): ReactElement => {
  const t = useI18nT()
  return (
    <ListSubheader disableSticky className="map-toolbar__menu-header">
      {t(labelKey)}
    </ListSubheader>
  )
}
