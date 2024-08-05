import React, { forwardRef } from 'react'
import { Button as MuiButton } from '@mui/material'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Objects } from '@openforis/arena-core'
import { TooltipNew } from '../TooltipNew'

export const Button = forwardRef((props, ref) => {
  const {
    active,
    children,
    className,
    color,
    disabled = false,
    iconAlt,
    iconClassName,
    iconHeight,
    iconSrc,
    iconWidth,
    id,
    isTitleMarkdown = false,
    label: labelProp,
    labelParams,
    onClick,
    primary,
    secondary,
    showIcon = true,
    showLabel = true,
    size = 'medium',
    testId,
    title: titleProp,
    titleParams,
    variant: variantProp = 'contained',
    ...otherProps
  } = props

  const i18n = useI18n()
  const label = showLabel && labelProp ? i18n.t(labelProp, labelParams) : null
  // use label as title when not showing label
  const title = titleProp
    ? i18n.t(titleProp, titleParams)
    : !showLabel && labelProp
      ? i18n.t(labelProp, labelParams)
      : null

  const variant = active ? 'contained' : variantProp

  const btn = (
    <MuiButton
      ref={ref}
      id={id}
      className={classNames('btn', className, {
        'btn-s': size === 'small',
        'btn-primary': primary,
        'btn-secondary': secondary,
      })}
      color={color}
      data-testid={testId}
      disabled={disabled ? disabled : undefined}
      onClick={onClick}
      variant={variant}
      {...otherProps}
    >
      {showIcon && (
        <>
          {iconClassName && <span className={classNames('icon', iconClassName, { 'icon-left': Boolean(label) })} />}
          {iconSrc && <img alt={iconAlt} height={iconHeight} src={iconSrc} width={iconWidth} />}
        </>
      )}
      {label}
      {children}
    </MuiButton>
  )
  if (Objects.isEmpty(title) || disabled) {
    return btn
  }
  return (
    <TooltipNew title={title} isTitleMarkdown={isTitleMarkdown}>
      {btn}
    </TooltipNew>
  )
})

Button.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  iconAlt: PropTypes.string,
  iconClassName: PropTypes.string,
  iconHeight: PropTypes.number,
  iconSrc: PropTypes.string,
  iconWidth: PropTypes.number,
  isTitleMarkdown: PropTypes.bool,
  label: PropTypes.string,
  labelParams: PropTypes.object,
  onClick: PropTypes.func,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string,
  title: PropTypes.string,
  titleParams: PropTypes.object,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
}

Button.defaultProps = {
  disabled: false,
  isTitleMarkdown: false,
  showLabel: true,
  size: 'medium',
  variant: 'contained',
}
