import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'

export const FormItem = (props) => {
  const {
    children,
    className = '',
    info = null,
    isInfoMarkdown = false,
    label: labelProp = null,
    labelParams = null,
    onInfoClick = null,
    required = false,
  } = props

  const i18n = useI18n()
  const label =
    Objects.isNotEmpty(labelProp) && typeof labelProp === 'string' ? i18n.t(labelProp, labelParams) : labelProp

  return (
    <div className={classNames('form-item', className)}>
      <div className="form-label">
        <div className="form-label-wrapper">
          {label}
          {required ? ' *' : ''}
          {info && <ButtonIconInfo onClick={onInfoClick} title={info} isTitleMarkdown={isInfoMarkdown} />}
        </div>
      </div>
      {children}
    </div>
  )
}

FormItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  info: PropTypes.string,
  isInfoMarkdown: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  labelParams: PropTypes.object,
  onInfoClick: PropTypes.func,
  required: PropTypes.bool,
}
