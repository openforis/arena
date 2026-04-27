import React, { forwardRef } from 'react'
import { Button as MuiButton } from '@mui/material'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { useI18nT } from '@webapp/store/system'

import { TooltipNew } from '../TooltipNew'

const getTitle = (props, t) => {
  const {
    label,
    labelIsI18nKey = true,
    labelParams,
    showLabel = true,
    title,
    titleIsI18nKey = true,
    titleParams,
  } = props
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
  const { label, labelIsI18nKey = true, labelParams, showLabel = true } = props
  if (!showLabel || !label) return null
  if (labelIsI18nKey) return t(label, labelParams)
  return label
}

const Icon = (props) => {
  const { icon, iconAlt, iconClassName, iconHeight, iconSrc, iconWidth, alignLeft, alignRight } = props
  return (
    <>
      {iconClassName && (
        <span className={classNames('icon', iconClassName, { 'icon-left': alignLeft, 'icon-right': alignRight })} />
      )}
      {iconSrc && <img alt={iconAlt} height={iconHeight} src={iconSrc} width={iconWidth} />}
      {icon}
    </>
  )
}

Icon.propTypes = {
  alignLeft: PropTypes.bool,
  alignRight: PropTypes.bool,
  icon: PropTypes.node,
  iconAlt: PropTypes.string,
  iconClassName: PropTypes.string,
  iconHeight: PropTypes.number,
  iconSrc: PropTypes.string,
  iconWidth: PropTypes.number,
}

export const Button = forwardRef((props, ref) => {
  const {
    active,
    children,
    className,
    closeTooltipOnClick = false,
    color,
    disabled = false,
    icon = null,
    iconAlt,
    iconClassName,
    iconHeight,
    iconSrc,
    iconEnd = null,
    iconEndClassName = null,
    iconEndSrc = null,
    iconWidth,
    id,
    isTitleMarkdown = false,
    labelIsI18nKey: _labelIsI18nKey, // exclude it from otherProps
    labelParams: _labelParams, // exclude it from otherProps
    onClick,
    primary,
    secondary,
    showIcon = true,
    showLabel: _showLabel, // exclude it from otherProps
    size = 'medium',
    testId,
    titleClassName,
    titleMarkdownClassName,
    titleMaxWidth,
    titleIsI18nKey: _titleIsI18nKey, // exclude it from otherProps
    titleParams: _titleParams, // exclude it from otherProps
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
      aria-label={label ?? title}
      className={classNames('btn', className, {
        'btn-s': size === 'small',
        'btn-primary': primary,
        'btn-secondary': secondary,
      })}
      color={color}
      data-testid={testId}
      disabled={disabled ? disabled : undefined}
      endIcon={
        showIcon &&
        (iconEnd || iconEndClassName || iconEndSrc) && (
          <Icon
            icon={iconEnd}
            iconAlt={iconAlt}
            iconClassName={iconEndClassName}
            iconHeight={iconHeight}
            iconSrc={iconEndSrc}
            iconWidth={iconWidth}
            alignRight={Boolean(label)}
          />
        )
      }
      onClick={onClick}
      startIcon={
        showIcon &&
        (icon || iconClassName || iconSrc) && (
          <Icon
            alignLeft={Boolean(label)}
            icon={icon}
            iconAlt={iconAlt}
            iconClassName={iconClassName}
            iconHeight={iconHeight}
            iconSrc={iconSrc}
            iconWidth={iconWidth}
          />
        )
      }
      variant={variant}
      {...otherProps}
      title={undefined} // title is handled by TooltipNew
    >
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
      closeOnClick={closeTooltipOnClick}
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
  closeTooltipOnClick: PropTypes.bool,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  icon: PropTypes.node,
  iconAlt: PropTypes.string,
  iconClassName: PropTypes.string,
  iconHeight: PropTypes.number,
  iconSrc: PropTypes.string,
  iconWidth: PropTypes.number,
  iconEnd: PropTypes.node,
  iconEndClassName: PropTypes.string,
  iconEndSrc: PropTypes.string,
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
