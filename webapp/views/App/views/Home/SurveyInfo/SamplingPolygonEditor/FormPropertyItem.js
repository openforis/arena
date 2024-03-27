import React from 'react'
import PropTypes from 'prop-types'

import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

export const FormPropertyItem = (props) => {
  const { objectkey, labelKey, onPropertyChange, value, samplingPolygonObject, readOnly, getFieldValidation } = props
  const i18n = useI18n()
  return (
    <FormItem label={i18n.t(`samplingPolygonOptions.${labelKey}`)}>
      <Input
        key={objectkey}
        id={`sampling-polygon-${labelKey}`}
        value={value}
        validation={getFieldValidation(samplingPolygonObject[objectkey])}
        onChange={onPropertyChange}
        readOnly={readOnly}
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
