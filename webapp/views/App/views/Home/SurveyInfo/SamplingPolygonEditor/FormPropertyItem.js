import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem, Input } from '@webapp/components/form/Input'

export const FormPropertyItem = (props) => {
  const {
    objectkey,
    labelKey,
    inputType = 'number',
    onPropertyChange,
    value,
    samplingPolygonObject,
    readOnly,
    getFieldValidation,
  } = props
  const i18n = useI18n()
  return (
    <FormItem label={i18n.t(`samplingPolygonOptions.${labelKey}`)}>
      <Input
        key={objectkey}
        id={`sampling-polygon-${labelKey}`}
        onChange={onPropertyChange}
        readOnly={readOnly}
        type={inputType}
        validation={getFieldValidation(samplingPolygonObject[objectkey])}
        value={value}
      />
    </FormItem>
  )
}

FormPropertyItem.propTypes = {
  inputType: PropTypes.string,
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
  value: PropTypes.any,
  objectkey: PropTypes.string,
  labelKey: PropTypes.string,
}
