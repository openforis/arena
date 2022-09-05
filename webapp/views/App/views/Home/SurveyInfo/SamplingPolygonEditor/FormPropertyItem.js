import React from 'react'
import { useI18n } from '@webapp/store/system'
import { Input } from '@webapp/components/form/Input'
import PropTypes from 'prop-types'

export const FormPropertyItem = (props) => {
  const { objectkey, labelKey, onPropertyChange, value, samplingPolygonObject, readOnly, getFieldValidation } = props
  const i18n = useI18n()
  return (
    <div className="form-item" key={labelKey}>
      <label className="form-label" htmlFor={`survey-info-${labelKey}`}>
        {i18n.t(`samplingPolygonOptions.${labelKey}`)}
      </label>
      <Input
        key={objectkey}
        id={`sampling-polygon-${labelKey}`}
        value={value}
        validation={getFieldValidation(samplingPolygonObject[objectkey])}
        onChange={onPropertyChange}
        readOnly={readOnly}
      />
    </div>
  )
}

FormPropertyItem.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
  value: PropTypes.any,
  objectkey: PropTypes.string,
  labelKey: PropTypes.string,
}
