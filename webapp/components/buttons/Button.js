import React, { forwardRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Objects } from '@openforis/arena-core'
import { TooltipNew } from '../TooltipNew'

export const Button = forwardRef((props, ref) => {
  const {
    children,
    className,
    disabled,
    iconClassName,
    id,
    isTitleMarkdown,
    label: labelProp,
    labelParams,
    onClick,
    primary,
    secondary,
    showLabel,
    size,
    testId,
    title: titleProp,
    titleParams,
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

  const btn = (
    <button
      ref={ref}
      id={id}
      data-testid={testId}
      disabled={disabled ? disabled : undefined}
      aria-disabled={disabled ? disabled : undefined}
      type="button"
      className={classNames('btn', className, {
        'btn-s': size === 'small',
        'btn-primary': primary,
        'btn-secondary': secondary,
      })}
      onClick={onClick}
      {...otherProps}
    >
      {iconClassName && <span className={classNames('icon', iconClassName, { 'icon-left': Boolean(label) })} />}
      {label}
      {children}
    </button>
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
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  iconClassName: PropTypes.string,
  isTitleMarkdown: PropTypes.bool,
  label: PropTypes.string,
  labelParams: PropTypes.object,
  onClick: PropTypes.func,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string,
  title: PropTypes.string,
  titleParams: PropTypes.object,
}

Button.defaultProps = {
  children: null,
  className: null,
  disabled: false,
  iconClassName: null,
  id: null,
  isTitleMarkdown: false,
  label: null,
  labelParams: null,
  onClick: null,
  showLabel: true,
  size: 'medium',
  testId: null,
  title: null,
  titleParams: null,
}
