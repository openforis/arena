import React from 'react'
import PropTypes from 'prop-types'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

export const FormPropertyItem = (props) => {
  const { objectKey, onPropertyChange, value, samplingPolygonObject, readOnly, getFieldValidation } = props
  return (
    <FormItem label={`samplingPolygonOptions.${objectKey}`}>
      <Input
        id={`sampling-polygon-${objectKey}`}
        numberFormat={NumberFormats.integer()}
        onChange={onPropertyChange}
        readOnly={readOnly}
        validation={getFieldValidation(samplingPolygonObject[objectKey])}
        value={value}
      />
    </FormItem>
  )
}

FormPropertyItem.propTypes = {
  key: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
  value: PropTypes.any,
  objectKey: PropTypes.string,
  labelKey: PropTypes.string,
}
