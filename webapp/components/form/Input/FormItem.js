import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'
import { useI18n } from '@webapp/store/system'

const getLabel = (props, i18n) => {
  const { appendColonToLabel = false, label: labelProp, labelParams } = props

  if (Objects.isNotEmpty(labelProp) && typeof labelProp === 'string') {
    const label = i18n.t(labelProp, { ...labelParams, interpolation: { escapeValue: false } })
    return appendColonToLabel && label ? `${label}:` : label
  } else {
    return labelProp
  }
}

export const FormItem = (props) => {
  const {
    children,
    className = '',
    hideLabelInMobile = false,
    info = null,
    infoTitleClassName = undefined,
    infoTitleMarkdownClassName = undefined,
    infoTitleMaxWidth = undefined,
    isInfoMarkdown = false,
    onInfoClick = null,
    required = false,
  } = props

  const i18n = useI18n()
  const label = getLabel(props, i18n)
  const isMobile = useIsMobile()

  const labelComponent =
    !isMobile || !hideLabelInMobile ? (
      <div className="form-label">
        <div className="form-label-wrapper">
          {label}
          {required ? ' *' : ''}
          {info && (
            <ButtonIconInfo
              onClick={onInfoClick}
              title={info}
              isTitleMarkdown={isInfoMarkdown}
              titleClassName={infoTitleClassName}
              titleMarkdownClassName={infoTitleMarkdownClassName}
              titleMaxWidth={infoTitleMaxWidth}
            />
          )}
        </div>
      </div>
    ) : null

  return (
    <div className={classNames('form-item', { mobile: isMobile }, className)}>
      {labelComponent}
      {children}
    </div>
  )
}

FormItem.propTypes = {
  appendColonToLabel: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  hideLabelInMobile: PropTypes.bool,
  info: PropTypes.string,
  isInfoMarkdown: PropTypes.bool,
  infoTitleClassName: PropTypes.string,
  infoTitleMarkdownClassName: PropTypes.string,
  infoTitleMaxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  labelParams: PropTypes.object,
  onInfoClick: PropTypes.func,
  required: PropTypes.bool,
}
