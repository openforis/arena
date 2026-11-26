import './ButtonSplit.scss'

import { useRef, useState } from 'react'
import ButtonGroup from '@mui/material/ButtonGroup'
import classNames from 'classnames'

import { AppIcon } from '../AppIcon'

import { Button, ButtonProps } from './Button'
import { ButtonMenuItem, ButtonMenuPopup } from './ButtonMenu'

type ButtonSplitProps = ButtonProps & {
  closeMenuOnItemClick?: boolean
  items: ButtonMenuItem[]
  menuButtonTestId?: string
  menuButtonTitle?: string
  menuClassName?: string
  onItemClick?: (item: ButtonMenuItem) => void
  selectedItemKey?: string
}

/**
 * Split button: a main action button and an arrow button opening a menu with alternative actions, framed as one control.
 * @param {ButtonSplitProps} props - The main button props, plus the menu items and options.
 * @returns {React.ReactElement} - The split button element.
 */
export const ButtonSplit = (props: ButtonSplitProps) => {
  const {
    className,
    closeMenuOnItemClick = true,
    items,
    menuButtonTestId,
    menuButtonTitle,
    menuClassName,
    onItemClick,
    selectedItemKey,
    size,
    variant = 'text',
    ...mainButtonProps
  } = props

  const groupRef = useRef<HTMLDivElement>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <ButtonGroup
        ref={groupRef}
        className={classNames('button-split', `button-split--${variant}`, className)}
        variant={variant}
      >
        <Button {...mainButtonProps} className="button-split__main-button" size={size} variant={variant} />
        <Button
          className="button-split__menu-button"
          onClick={() => setAnchorEl(groupRef.current)}
          size={size}
          testId={menuButtonTestId}
          title={menuButtonTitle}
          variant={variant}
        >
          <AppIcon className="button-split__menu-button-icon" name="dropDown" size={20} />
        </Button>
      </ButtonGroup>

      <ButtonMenuPopup
        anchorEl={anchorEl}
        closeMenuOnItemClick={closeMenuOnItemClick}
        items={items}
        menuClassName={menuClassName}
        onClose={() => setAnchorEl(null)}
        onItemClick={onItemClick}
        selectedItemKey={selectedItemKey}
      />
    </>
  )
}
