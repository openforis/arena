import React from 'react'
import PropTypes from 'prop-types'

import { FormPropertyItem } from './FormPropertyItem'

export const RectangleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'lengthLatitude' },
    { key: 'lengthLongitude' },
    { key: 'numberOfPointsNorth' },
    { key: 'numberOfPointsEast' },
  ]
  return (
    <>
      {inputPropertiesForRectangle.map(({ key }) => (
        <FormPropertyItem
          key={key}
          objectKey={key}
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
