import React, { useState } from 'react'
import PropTypes from 'prop-types'
import SamplingPolygonShapeEditor from '../SamplingPolygonShapeEditor'
import Switch from 'react-switch'
import { getSamplingPolygonDefaults } from '@core/survey/_survey/surveyDefaults'
import { FormPropertyItem } from './FormPropertyItem'
import { CircleOnlyItems } from './CircleOnlyItems'
import { RectangleOnlyItems } from './RectangleOnlyItems'

const SamplingPolygonEditor = (props) => {
  const { readOnly, samplingPolygon, getFieldValidation, setSamplingPolygon } = props
  const samplingPolygonObject =
    samplingPolygon === undefined || Object.entries(samplingPolygon).length == 0
      ? getSamplingPolygonDefaults()
      : samplingPolygon

  const [jsonEditorChecked, setJsonEditorChecked] = useState(false)
  const [jsonEditorValue, setJsonEditorValue] = useState(JSON.stringify(samplingPolygonObject, null, 2))

  const inputPropertiesForAll = [
    { key: 'offset_north', labelKey: 'offsetNorth' },
    { key: 'offset_east', labelKey: 'offsetEast' },
    { key: 'control_point_offset_north', labelKey: 'controlPointOffsetNorth' },
    { key: 'control_point_offset_east', labelKey: 'controlPointOffsetEast' },
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

  if (jsonEditorChecked)
    return (
      <div className="form">
        <div className="form-item" key={'checkbox'}>
          <label className="form-label">
            <span>JSON </span>
            <Switch checked={jsonEditorChecked} onChange={() => setJsonEditorChecked(!jsonEditorChecked)} height={20} />
          </label>
        </div>
        <div className="form-item" key={'jsonEditor'}>
          <label className="form-label" htmlFor="survey-info-sampling-json-editor">
            JSON
          </label>
          <textarea value={jsonEditorValue} rows={12} onChange={jsonEditorOnChange} />
        </div>
      </div>
    )

  return (
    <div className="form">
      <div className="form-item" key={'checkbox'}>
        <label className="form-label">
          <span>JSON </span>
          <Switch checked={jsonEditorChecked} onChange={() => setJsonEditorChecked(!jsonEditorChecked)} height={20} />
        </label>
      </div>
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
  )
}

SamplingPolygonEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  samplingPolygon: PropTypes.object,
  getFieldValidation: PropTypes.func,
  setSamplingPolygon: PropTypes.func,
}

export default SamplingPolygonEditor
