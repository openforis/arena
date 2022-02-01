import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const Button = (props) => {
  const {
    className,
    disabled,
    iconClassName,
    id,
    label: labelProp,
    onClick,
    showLabel,
    size,
    testId,
    title: titleProp,
    titleParams,
    ...otherProps
  } = props

  const i18n = useI18n()
  const label = showLabel && labelProp ? i18n.t(labelProp) : null
  // use label as title when not showing label
  const title = titleProp ? i18n.t(titleProp, titleParams) : !showLabel && labelProp ? i18n.t(labelProp) : null

  return (
    <button
      id={id}
      data-testid={testId}
      disabled={disabled ? disabled : undefined}
      aria-disabled={disabled ? disabled : undefined}
      type="button"
      className={classNames('btn', className, { 'btn-s': size === 'small' })}
      onClick={onClick}
      title={title}
      {...otherProps}
    >
      {iconClassName && <span className={classNames('icon', iconClassName, { 'icon-left': Boolean(label) })} />}
      {label}
    </button>
  )
}

Button.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  iconClassName: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string,
  title: PropTypes.string,
  titleParams: PropTypes.object,
}

Button.defaultProps = {
  className: null,
  disabled: false,
  iconClassName: null,
  id: null,
  label: null,
  onClick: null,
  showLabel: true,
  size: 'medium',
  testId: null,
  title: null,
  titleParams: null,
}
