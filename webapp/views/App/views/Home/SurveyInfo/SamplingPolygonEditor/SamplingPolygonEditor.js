import './SamplingPolygonEditor.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { getSamplingPolygonDefaults } from '@core/survey/_survey/surveyDefaults'

import { useI18n } from '@webapp/store/system'

import SamplingPolygonShapeEditor from '../SamplingPolygonShapeEditor'
import { FormPropertyItem } from './FormPropertyItem'
import { CircleOnlyItems } from './CircleOnlyItems'
import { RectangleOnlyItems } from './RectangleOnlyItems'

const SamplingPolygonEditor = (props) => {
  const { readOnly, samplingPolygon, getFieldValidation, setSamplingPolygon } = props

  const i18n = useI18n()

  const samplingPolygonObject = Objects.isEmpty(samplingPolygon) ? getSamplingPolygonDefaults() : samplingPolygon

  const inputPropertiesForAll = [
    { key: 'offsetNorth', labelKey: 'offsetNorth' },
    { key: 'offsetEast', labelKey: 'offsetEast' },
    { key: 'controlPointOffsetNorth', labelKey: 'controlPointOffsetNorth' },
    { key: 'controlPointOffsetEast', labelKey: 'controlPointOffsetEast' },
  ]

  const onSamplingPolygonChange = useCallback(
    (samplingPolygonNext) => {
      setSamplingPolygon(samplingPolygonNext)
    },
    [setSamplingPolygon]
  )

  const onPropertyChange = (key) => (e) => {
    const value = e?.target?.value ?? e
    onSamplingPolygonChange({ ...samplingPolygonObject, [key]: Number(value) })
  }

  const onShapeChange = (value) => {
    onSamplingPolygonChange({ ...samplingPolygonObject, ['isCircle']: value === 'true' })
  }

  return (
    <fieldset className="sampling-polygon">
      <legend>{i18n.t('samplingPolygonOptions.samplingPolygon')}</legend>

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
        {inputPropertiesForAll.map(({ key, labelKey }) => (
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
      </div>
    </fieldset>
  )
}

SamplingPolygonEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  samplingPolygon: PropTypes.object,
  getFieldValidation: PropTypes.func,
  setSamplingPolygon: PropTypes.func,
}

export default SamplingPolygonEditor
