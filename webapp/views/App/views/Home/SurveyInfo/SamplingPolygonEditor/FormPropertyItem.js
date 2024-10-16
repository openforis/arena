import React from 'react'
import PropTypes from 'prop-types'

import { FormItem, Input } from '@webapp/components/form/Input'

export const FormPropertyItem = (props) => {
  const { objectkey, labelKey, onPropertyChange, value, samplingPolygonObject, readOnly, getFieldValidation } = props
  return (
    <FormItem label={`samplingPolygonOptions.${labelKey}`}>
      <Input
        key={objectkey}
        id={`sampling-polygon-${labelKey}`}
        onChange={onPropertyChange}
        readOnly={readOnly}
        type="number"
        validation={getFieldValidation(samplingPolygonObject[objectkey])}
        value={value}
      />
    </FormItem>
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
