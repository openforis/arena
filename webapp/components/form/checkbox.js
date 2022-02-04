import React from 'react'
import PropTypes from 'prop-types'

import ValidationTooltip from '../validationTooltip'

const Checkbox = (props) => {
  const { id, validation, checked, label, onChange, disabled, radio } = props

  return (
    <div style={{ justifySelf: 'start' }}>
      <ValidationTooltip validation={validation}>
        <button
          type="button"
          data-testid={id}
          className="btn btn-s btn-transparent btn-checkbox"
          onClick={() => onChange?.(!checked)}
          aria-disabled={disabled}
        >
          <span className={`icon icon-${radio ? 'radio' : 'checkbox'}-${!checked ? 'un' : ''}checked icon-18px`} />
          {label}
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
