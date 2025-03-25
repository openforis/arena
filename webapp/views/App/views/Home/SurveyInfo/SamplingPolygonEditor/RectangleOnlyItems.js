import React from 'react'
import PropTypes from 'prop-types'

import { FormPropertyItem } from './FormPropertyItem'

export const RectangleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'lengthLatitude', allowNegative: false },
    { key: 'lengthLongitude', allowNegative: false },
    { key: 'numberOfPointsNorth', allowNegative: false },
    { key: 'numberOfPointsEast', allowNegative: false },
  ]
  return (
    <>
      {inputPropertiesForRectangle.map(({ key, allowNegative }) => (
        <FormPropertyItem
          key={key}
          allowNegative={allowNegative}
          getFieldValidation={getFieldValidation}
          objectKey={key}
          onPropertyChange={onPropertyChange(key)}
          readOnly={readOnly}
          samplingPolygonObject={samplingPolygonObject}
          value={samplingPolygonObject[key]}
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
