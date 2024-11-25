import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'

import { FormPropertyItem } from './FormPropertyItem'

const controlPointsOptions = [0, 4, 5, 10, 12, 21]

export const CircleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForCircle = [{ key: 'radius', allowNegative: false }]
  return (
    <>
      <FormItem label="samplingPolygonOptions.numberOfControlPoints">
        <Dropdown
          items={controlPointsOptions}
          itemLabel={A.identity}
          itemValue={A.identity}
          selection={samplingPolygonObject.numberOfPointsCircle}
          onChange={onPropertyChange('numberOfPointsCircle')}
        />
      </FormItem>
      {inputPropertiesForCircle.map(({ key, allowNegative }) => (
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

CircleOnlyItems.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  onPropertyChange: PropTypes.func,
  samplingPolygonObject: PropTypes.object,
  getFieldValidation: PropTypes.func,
}
