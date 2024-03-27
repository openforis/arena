import './SamplingPolygonEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Switch from 'react-switch'

import { getSamplingPolygonDefaults } from '@core/survey/_survey/surveyDefaults'

import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import SamplingPolygonShapeEditor from '../SamplingPolygonShapeEditor'

import { CircleOnlyItems } from './CircleOnlyItems'
import { FormPropertyItem } from './FormPropertyItem'
import { RectangleOnlyItems } from './RectangleOnlyItems'

const SamplingPolygonEditor = (props) => {
  const { readOnly, samplingPolygon, getFieldValidation, setSamplingPolygon } = props

  const i18n = useI18n()

  const samplingPolygonObject =
    samplingPolygon === undefined || Object.entries(samplingPolygon).length == 0
      ? getSamplingPolygonDefaults()
      : samplingPolygon

  const [jsonEditorChecked, setJsonEditorChecked] = useState(false)
  const [jsonEditorValue, setJsonEditorValue] = useState(JSON.stringify(samplingPolygonObject, null, 2))

  const inputPropertiesForAll = [
    { key: 'offsetNorth', labelKey: 'offsetNorth' },
    { key: 'offsetEast', labelKey: 'offsetEast' },
    { key: 'controlPointOffsetNorth', labelKey: 'controlPointOffsetNorth' },
    { key: 'controlPointOffsetEast', labelKey: 'controlPointOffsetEast' },
  ]

  const onPropertyChange = (key) => (e) => {
    let value
    if (e.target) {
      value = e.target.value
    } else {
      value = e
    }
    samplingPolygonObject[key] = Number(value)
    setSamplingPolygon(samplingPolygonObject)
    setJsonEditorValue(JSON.stringify(samplingPolygonObject, null, 2))
  }

  const shapeOnChange = (e) => {
    samplingPolygonObject.isCircle = e.target.value === 'true'
    setSamplingPolygon(samplingPolygonObject)
    setJsonEditorValue(JSON.stringify(samplingPolygonObject, null, 2))
  }

  const jsonEditorOnChange = (event) => {
    const value = event.target.value
    setJsonEditorValue(value)
    try {
      const json = JSON.parse(event.target.value)
      setSamplingPolygon(json)
    } catch {
      return //dont save invalid json
    }
  }

  return (
    <fieldset className="sampling-polygon">
      <legend>{i18n.t('samplingPolygonOptions.samplingPolygon')}</legend>

      <FormItem label="JSON">
        <div>
          <Switch checked={jsonEditorChecked} onChange={() => setJsonEditorChecked(!jsonEditorChecked)} height={20} />
        </div>
      </FormItem>
      {jsonEditorChecked && (
        <textarea className="json-editor" value={jsonEditorValue} rows={12} onChange={jsonEditorOnChange} />
      )}
      {!jsonEditorChecked && (
        <div className="props-editor-wrapper">
          <SamplingPolygonShapeEditor
            isCircle={samplingPolygonObject.isCircle}
            onChange={shapeOnChange}
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
      )}
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
