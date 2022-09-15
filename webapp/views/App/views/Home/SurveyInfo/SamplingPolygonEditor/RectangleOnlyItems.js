import React from 'react'
import PropTypes from 'prop-types'

import { FormPropertyItem } from './FormPropertyItem'

export const RectangleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'lengthLatitude', labelKey: 'lengthLatitude' },
    { key: 'lengthLongitude', labelKey: 'lengthLongitude' },
    { key: 'numberOfPointsNorth', labelKey: 'numberOfControlPointsNorth' },
    { key: 'numberOfPointsEast', labelKey: 'numberOfControlPointsEast' },
  ]
  return (
    <>
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
    </>
  )
}

RectangleOnlyItems.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
}
