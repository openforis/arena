import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { FormPropertyItem } from './FormPropertyItem'

const controlPointsOptions = [0, 4, 5, 10, 12, 21]

export const CircleOnlyItems = (props) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const i18n = useI18n()
  const inputPropertiesForCircle = [{ key: 'radius', labelKey: 'radius' }]
  return (
    <>
      <FormItem label={i18n.t('samplingPolygonOptions.numberOfControlPoints')}>
        <Dropdown
          items={controlPointsOptions}
          itemLabel={A.identity}
          itemValue={A.identity}
          selection={samplingPolygonObject.numberOfPointsCircle}
          onChange={onPropertyChange('numberOfPointsCircle')}
        />
      </FormItem>
      {inputPropertiesForCircle.map(({ key, labelKey }) => (
        <FormPropertyItem
          key={key}
          objectKey={key}
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
