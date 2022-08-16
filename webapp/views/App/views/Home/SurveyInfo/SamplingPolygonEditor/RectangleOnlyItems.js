import React from 'react'
import { FormPropertyItem } from './FormPropertyItem'
import PropTypes from 'prop-types'

export const RectangleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'lengthLatitude', labelKey: 'lengthLatitude' },
    { key: 'lengthLongitude', labelKey: 'lengthLongitude' },
    { key: 'numberOfPointsNorth', labelKey: 'numberOfControlPointsNorth' },
    { key: 'numberOfPointsEast', labelKey: 'numberOfControlPointsEast' },
  ]
  return (
    <div className="form">
      {inputPropertiesForRectangle.map(({ key, labelKey }) => (
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

RectangleOnlyItems.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
}
