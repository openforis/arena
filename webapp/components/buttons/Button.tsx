/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { forwardRef } from 'react'
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { useI18nT } from '@webapp/store/system'

import { TooltipNew } from '../TooltipNew'

export type ButtonProps = Omit<MuiButtonProps, 'color' | 'title' | 'variant' | 'size'> & {
  active?: boolean
  closeTooltipOnClick?: boolean
  color?: string
  icon?: React.ReactNode
  iconAlt?: string
  iconClassName?: string
  iconHeight?: number
  iconSrc?: string
  iconEnd?: React.ReactNode
  iconEndClassName?: string
  iconEndSrc?: string
  iconWidth?: number
  isTitleMarkdown?: boolean
  label?: string
  labelIsI18nKey?: boolean
  labelParams?: Record<string, unknown>
  primary?: boolean
  secondary?: boolean
  showIcon?: boolean
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
  testId?: string
  title?: string
  titleClassName?: string
  titleIsI18nKey?: boolean
  titleMarkdownClassName?: string
  titleMaxWidth?: string | number
  titleParams?: Record<string, unknown>
  variant?: 'contained' | 'outlined' | 'text'
}

type IconProps = {
  alignLeft?: boolean
  alignRight?: boolean
  icon?: React.ReactNode
  iconAlt?: string
  iconClassName?: string
  iconHeight?: number
  iconSrc?: string
  iconWidth?: number
}

const Icon = (props: IconProps) => {
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

type I18nT = (key: string, params?: Record<string, unknown>) => string

const getTitle = (props: ButtonProps, t: I18nT): string | null => {
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

const getLabel = (props: ButtonProps, t: I18nT): string | null => {
  const { label, labelIsI18nKey = true, labelParams, showLabel = true } = props
  if (!showLabel || !label) return null
  if (labelIsI18nKey) return t(label, labelParams)
  return label
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
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
    labelIsI18nKey: _labelIsI18nKey,
    labelParams: _labelParams,
    onClick,
    primary,
    secondary,
    showIcon = true,
    showLabel: _showLabel,
    size = 'medium',
    testId,
    titleClassName,
    titleMarkdownClassName,
    titleMaxWidth,
    titleIsI18nKey: _titleIsI18nKey,
    titleParams: _titleParams,
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
      aria-label={label ?? title ?? undefined}
      className={classNames('btn', className, {
        'btn-s': size === 'small',
        'btn-primary': primary,
        'btn-secondary': secondary,
      })}
      color={color as MuiButtonProps['color']}
      data-testid={testId}
      disabled={disabled || undefined}
      endIcon={
        showIcon &&
        (iconEnd || iconEndClassName || iconEndSrc) && (
          <Icon
            icon={iconEnd}
            iconAlt={iconAlt}
            iconClassName={iconEndClassName ?? undefined}
            iconHeight={iconHeight}
            iconSrc={iconEndSrc ?? undefined}
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
      title={undefined}
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

Button.displayName = 'Button'
