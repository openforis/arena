import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const Button = (props) => {
  const { className, containerClassName, disabled, iconClassName, id, label, showLabel, onClick, size, testId, title, ...otherProps } = props

  const i18n = useI18n()

  return (
    <button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      type="button"
      className={classNames('btn', className, { 'btn-s': size === 'small' }, containerClassName)}
      onClick={onClick}
      title={title ? i18n.t(title) : (showLabel && label ? i18n.t(label) : null)}
      {...otherProps}
    >
      {iconClassName && <span className={`icon ${iconClassName}${label ? ' icon-left' : ''}`} />}
      {showLabel && label ? i18n.t(label) : null}
    </button>
  )
}

Button.propTypes = {
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  disabled: PropTypes.bool,
  showLabel: PropTypes.bool,
  id: PropTypes.string,
  iconClassName: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string,
  title: PropTypes.string,
}

Button.defaultProps = {
  className: null,
  containerClassName: null,
  disabled: false,
  showLabel: true,
  iconClassName: null,
  id: null,
  label: null,
  size: 'medium',
  testId: null,
  title: null,
}
