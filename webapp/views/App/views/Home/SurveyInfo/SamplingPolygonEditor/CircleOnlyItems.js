import React from 'react'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import { FormPropertyItem } from './FormPropertyItem'

export const CircleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const i18n = useI18n()
  const inputPropertiesForCircle = [{ key: 'radius', labelKey: 'radius' }]
  return (
    <>
      <FormItem label={i18n.t('samplingPolygonOptions.numberOfControlPoints')}>
        <select value={samplingPolygonObject.numberOfPointsCircle} onChange={onPropertyChange('numberOfPointsCircle')}>
          <option value="0">0</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="21">21</option>
        </select>
      </FormItem>
      {inputPropertiesForCircle.map(({ key, labelKey }) => (
        <FormPropertyItem
          key={key}
          ObjectKey={key}
          labelKey={labelKey}
          onPropertyChange={onPropertyChange(key)}
          value={samplingPolygonObject[key]}
          samplingPolygonObject={samplingPolygonObject}
          readOnly={readOnly}
          getFieldValidation={getFieldValidation}
        />
      ))}
    </>
  )
}

CircleOnlyItems.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
}
