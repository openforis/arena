import React, { forwardRef } from 'react'
import { Button as MuiButton } from '@mui/material'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { useI18nT } from '@webapp/store/system'

import { TooltipNew } from '../TooltipNew'

const getTitle = (props, t) => {
  const { labelParams, label, titleParams, title } = props
  const { labelIsI18nKey = true, showLabel = true, titleIsI18nKey = true } = props
  if (title) {
    if (titleIsI18nKey) return t(title, titleParams)
    return title
  }
  if (!showLabel && label) {
    if (labelIsI18nKey) return t(label, labelParams)
    return label
  }
  return null
}

const getLabel = (props, t) => {
  const { labelIsI18nKey = true, labelParams, label, showLabel = true } = props
  if (!showLabel || !label) return null
  if (labelIsI18nKey) return t(label, labelParams)
  return label
}

export const Button = forwardRef((props, ref) => {
  const {
    active,
    children,
    className,
    color,
    disabled = false,
    icon = null,
    iconAlt,
    iconClassName,
    iconHeight,
    iconSrc,
    iconWidth,
    id,
    isTitleMarkdown = false,
    onClick,
    primary,
    secondary,
    showIcon = true,
    showLabel = true,
    size = 'medium',
    testId,
    titleClassName,
    titleMarkdownClassName,
    titleMaxWidth,
    variant: variantProp = 'contained',
    ...otherProps
  } = props

  const t = useI18nT({ unescapeHtml: true })

  const label = getLabel(props, t)

  const title = getTitle(props, t)

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
          {icon}
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
    <TooltipNew
      className={titleClassName}
      title={title}
      markdownClassName={titleMarkdownClassName}
      isTitleMarkdown={isTitleMarkdown}
      maxWidth={titleMaxWidth}
    >
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
  icon: PropTypes.node,
  iconAlt: PropTypes.string,
  iconClassName: PropTypes.string,
  iconHeight: PropTypes.number,
  iconSrc: PropTypes.string,
  iconWidth: PropTypes.number,
  isTitleMarkdown: PropTypes.bool,
  label: PropTypes.string,
  labelIsI18nKey: PropTypes.bool,
  labelParams: PropTypes.object,
  onClick: PropTypes.func,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string,
  title: PropTypes.string,
  titleClassName: PropTypes.string,
  titleIsI18nKey: PropTypes.bool,
  titleMarkdownClassName: PropTypes.string,
  titleMaxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  titleParams: PropTypes.object,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
}
