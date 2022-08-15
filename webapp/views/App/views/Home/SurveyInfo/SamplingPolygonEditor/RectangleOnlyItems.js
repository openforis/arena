import React from 'react'
import { FormPropertyItem } from './FormPropertyItem'
import PropTypes from 'prop-types'

export const RectangleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'length_latitude', labelKey: 'lengthLatitude' },
    { key: 'length_longitude', labelKey: 'lengthLongitude' },
    { key: 'number_of_points_north', labelKey: 'numberOfControlPointsNorth' },
    { key: 'number_of_points_east', labelKey: 'numberOfControlPointsEast' },
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
