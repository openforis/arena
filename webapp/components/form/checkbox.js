import './checkbox.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import ValidationTooltip from '../validationTooltip'
import { useI18n } from '@webapp/store/system'
import { Objects } from '@openforis/arena-core'

const Checkbox = (props) => {
  const { id, validation, checked, label, onChange: onChangeProp, disabled, radio } = props

  const i18n = useI18n()

  const onChange = useCallback((e) => onChangeProp?.(e.target.checked), [onChangeProp])

  const hasLabel = !Objects.isEmpty(label)
  const classNameIcon = `icon-${radio ? 'radio' : 'checkbox'}-${!checked ? 'un' : ''}checked`
  const className = `icon icon-18px ${classNameIcon}${hasLabel ? ' icon-left' : ''}`

  return (
    <div style={{ justifySelf: 'start' }}>
      <ValidationTooltip validation={validation}>
        <button
          type="button"
          data-testid={id}
          className="btn btn-s btn-transparent btn-checkbox"
          onClick={onChange}
          aria-disabled={disabled}
        >
          <span className={className} />
          {i18n.t(label)}
        </button>
      </ValidationTooltip>
    </div>
  )
}

Checkbox.propTypes = {
  id: PropTypes.string,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
  radio: PropTypes.bool,
  validation: PropTypes.object,
}

Checkbox.defaultProps = {
  id: null,
  checked: false,
  disabled: false,
  label: null,
  onChange: null,
  radio: false,
  validation: {},
}

export default Checkbox
