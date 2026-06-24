import './SamplingPolygonEditor.scss'

import PropTypes from 'prop-types'
import { useCallback } from 'react'

import { Numbers, Objects } from '@openforis/arena-core'

import { getSamplingPolygonDefaults } from '@core/survey/SamplingPolygon'

import { Fieldset } from '@webapp/components'

import SamplingPolygonShapeEditor from '../SamplingPolygonShapeEditor'
import { CircleOnlyItems } from './CircleOnlyItems'
import { FormPropertyItem } from './FormPropertyItem'
import { RectangleOnlyItems } from './RectangleOnlyItems'

const SamplingPolygonEditor = (props) => {
  const { readOnly, samplingPolygon, getFieldValidation, setSamplingPolygon } = props

  const samplingPolygonObject = Objects.isEmpty(samplingPolygon) ? getSamplingPolygonDefaults() : samplingPolygon

  const commonInputFields = [
    { key: 'offsetNorth' },
    { key: 'offsetEast' },
    { key: 'controlPointOffsetNorth', allowNegative: false },
    { key: 'controlPointOffsetEast', allowNegative: false },
  ]

  const onSamplingPolygonChange = useCallback(
    (samplingPolygonNext) => {
      setSamplingPolygon(samplingPolygonNext)
    },
    [setSamplingPolygon]
  )

  const onPropertyChange = (key) => (e) => {
    const value = e?.target?.value ?? e
    const numericValue = Numbers.toNumber(value)
    onSamplingPolygonChange({ ...samplingPolygonObject, [key]: numericValue })
  }

  const onShapeChange = (value) => {
    onSamplingPolygonChange({ ...samplingPolygonObject, ['isCircle']: value === 'true' })
  }

  return (
    <Fieldset className="sampling-polygon" legend="samplingPolygonOptions.samplingPolygon">
      <div className="props-editor-wrapper">
        <SamplingPolygonShapeEditor
          isCircle={samplingPolygonObject.isCircle}
          onChange={onShapeChange}
          readOnly={readOnly}
          key={'ShapeEditor'}
        />
        {samplingPolygonObject.isCircle && (
          <CircleOnlyItems
            onPropertyChange={onPropertyChange}
            samplingPolygonObject={samplingPolygonObject}
            getFieldValidation={getFieldValidation}
            readOnly={readOnly}
          />
        )}
        {!samplingPolygonObject.isCircle && (
          <RectangleOnlyItems
            onPropertyChange={onPropertyChange}
            samplingPolygonObject={samplingPolygonObject}
            getFieldValidation={getFieldValidation}
            readOnly={readOnly}
          />
        )}
        {commonInputFields.map(({ key, allowNegative }) => (
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
      </div>
    </Fieldset>
  )
}

SamplingPolygonEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  samplingPolygon: PropTypes.object,
  getFieldValidation: PropTypes.func,
  setSamplingPolygon: PropTypes.func,
}

export default SamplingPolygonEditor
