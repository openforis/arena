import React from 'react'
import { useI18n } from '@webapp/store/system'
import { FormPropertyItem } from './FormPropertyItem'
import PropTypes from 'prop-types'

export const CircleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const i18n = useI18n()
  const inputPropertiesForCircle = [{ key: 'radius', labelKey: 'radius' }]
  return (
    <div className="form">
      <div className="form-item" key={'numberOfPointsCircleEditor'}>
        <label className="form-label" htmlFor="survey-info-sampling-number-of-points-circle">
          {i18n.t('samplingPolygonOptions.numberOfControlPoints')}
        </label>

        <select value={samplingPolygonObject.numberOfPointsCircle} onChange={onPropertyChange('numberOfPointsCircle')}>
          <option value="0">0</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="21">21</option>
        </select>
      </div>
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
    </div>
  )
}

CircleOnlyItems.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
}
