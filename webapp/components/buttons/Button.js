import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const Button = (props) => {
  const { className, disabled, iconClassName, id, label, showLabel, onClick, size, testId, title, ...otherProps } =
    props

  const i18n = useI18n()

  return (
    <button
      id={id}
      data-testid={testId}
      disabled={disabled}
      aria-disabled={disabled}
      type="button"
      className={classNames('btn', className, { 'btn-s': size === 'small' })}
      onClick={onClick}
      title={title ? i18n.t(title) : null}
      {...otherProps}
    >
      {iconClassName && <span className={classNames('icon', iconClassName, { 'icon-left': Boolean(label) })} />}
      {showLabel && label ? i18n.t(label) : null}
    </button>
  )
}

Button.propTypes = {
  className: PropTypes.string,
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
  disabled: false,
  showLabel: true,
  iconClassName: null,
  id: null,
  label: null,
  size: 'medium',
  testId: null,
  title: null,
}
