import React from 'react'
import PropTypes from 'prop-types'
import { Input } from '@webapp/components/form/Input'
import SamplingPolygonShapeEditor from '../SamplingPolygonShapeEditor'
import { useI18n } from '@webapp/store/system'

const SamplingPolygonEditor = (props) => {
  const { readOnly, samplingPolygon, getFieldValidation, setSamplingPolygon } = props
  const samplingPolygonObject = JSON.parse(samplingPolygon.en || samplingPolygon)
  const i18n = useI18n()

  const getItems = () => {
    let items = []

    items.push(<SamplingPolygonShapeEditor isCircle={samplingPolygonObject.isCircle} onChange={shapeOnChange} />)

    if (samplingPolygonObject.isCircle == 'true') {
      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-polygon-radius">
            {i18n.t('samplingPolygonOptions.radius')}
          </label>
          <Input
            id="sampling-polygon-radius"
            value={samplingPolygonObject.radius}
            validation={getFieldValidation(samplingPolygonObject.radius)}
            onChange={radiusOnChange}
            readOnly={readOnly}
          />
        </div>
      )

      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-number-of-points-circle">
            {i18n.t('samplingPolygonOptions.numberOfControlPoints')}
          </label>

          <select value={samplingPolygonObject.number_of_points_circle} onChange={numberOfPointsCircleOnChange}>
            <option value="0">0</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="21">21</option>
          </select>
        </div>
      )
    } else {
      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-polygon-length-latitude">
            {i18n.t('samplingPolygonOptions.lengthLatitude')}
          </label>
          <Input
            id="sampling-polygon-length-latitude"
            value={samplingPolygonObject.length_latitude}
            validation={getFieldValidation(samplingPolygonObject.length_latitude)}
            onChange={lengthLatitudeOnChange}
            readOnly={readOnly}
          />
        </div>
      )

      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-polygon-length-longitude">
            {i18n.t('samplingPolygonOptions.lengthLongitude')}
          </label>
          <Input
            id="sampling-polygon-length-longitude"
            value={samplingPolygonObject.length_longitude}
            validation={getFieldValidation(samplingPolygonObject.length_longitude)}
            onChange={lengthLongitudeOnChange}
            readOnly={readOnly}
          />
        </div>
      )

      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-number-of-points-north">
            {i18n.t('samplingPolygonOptions.numberOfControlPointsNorth')}
          </label>
          <Input
            id="sampling-polygon-number-of-points-north"
            value={samplingPolygonObject.number_of_points_north}
            validation={getFieldValidation(samplingPolygonObject.number_of_points_north)}
            onChange={numberOfPointsNorthOnChange}
            readOnly={readOnly}
          />
        </div>
      )

      items.push(
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-sampling-number-of-points-east">
            {i18n.t('samplingPolygonOptions.numberOfControlPointsEast')}
          </label>
          <Input
            id="sampling-polygon-number-of-points-east"
            value={samplingPolygonObject.number_of_points_east}
            validation={getFieldValidation(samplingPolygonObject.number_of_points_east)}
            onChange={numberOfPointsEastOnChange}
            readOnly={readOnly}
          />
        </div>
      )
    }
    items.push(
      <div className="form-item">
        <label className="form-label" htmlFor="survey-info-sampling-offset-north">
          {i18n.t('samplingPolygonOptions.offsetNorth')}
        </label>
        <Input
          id="sampling-polygon-offset-north"
          value={samplingPolygonObject.offset_north}
          validation={getFieldValidation(samplingPolygonObject.offset_north)}
          onChange={offsetNorthOnChange}
          readOnly={readOnly}
        />
      </div>
    )

    items.push(
      <div className="form-item">
        <label className="form-label" htmlFor="survey-info-sampling-offset-east">
          {i18n.t('samplingPolygonOptions.offsetEast')}
        </label>
        <Input
          id="sampling-polygon-offset-east"
          value={samplingPolygonObject.offset_east}
          validation={getFieldValidation(samplingPolygonObject.offset_east)}
          onChange={offsetEastOnChange}
          readOnly={readOnly}
        />
      </div>
    )

    items.push(
      <div className="form-item">
        <label className="form-label" htmlFor="survey-info-sampling-control-point-offset-north">
          {i18n.t('samplingPolygonOptions.controlPointOffsetNorth')}
        </label>
        <Input
          id="sampling-polygon-control-point-offset-north"
          value={samplingPolygonObject.controlpoint_offset_north}
          validation={getFieldValidation(samplingPolygonObject.controlpoint_offset_north)}
          onChange={controlPointOffsetNorthOnChange}
          readOnly={readOnly}
        />
      </div>
    )

    items.push(
      <div className="form-item">
        <label className="form-label" htmlFor="survey-info-sampling-control-point-offset-east">
          {i18n.t('samplingPolygonOptions.controlPointOffsetEast')}
        </label>
        <Input
          id="sampling-polygon-control-point-offset-east"
          value={samplingPolygonObject.controlpoint_offset_east}
          validation={getFieldValidation(samplingPolygonObject.controlpoint_offset_east)}
          onChange={constrolPointOffsetEastOnChange}
          readOnly={readOnly}
        />
      </div>
    )

    return items
  }

  const shapeOnChange = (e) => {
    samplingPolygonObject.isCircle = e.target.value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const radiusOnChange = (value) => {
    samplingPolygonObject.radius = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const numberOfPointsCircleOnChange = (e) => {
    samplingPolygonObject.number_of_points_circle = e.target.value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const lengthLatitudeOnChange = (value) => {
    samplingPolygonObject.length_latitude = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const lengthLongitudeOnChange = (value) => {
    samplingPolygonObject.length_longitude = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const numberOfPointsNorthOnChange = (value) => {
    samplingPolygonObject.number_of_points_north = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const numberOfPointsEastOnChange = (value) => {
    samplingPolygonObject.number_of_points_east = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const offsetNorthOnChange = (value) => {
    samplingPolygonObject.offset_north = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const offsetEastOnChange = (value) => {
    samplingPolygonObject.offset_east = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const controlPointOffsetNorthOnChange = (value) => {
    samplingPolygonObject.controlpoint_offset_north = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }
  const constrolPointOffsetEastOnChange = (value) => {
    samplingPolygonObject.controlpoint_offset_east = value
    setSamplingPolygon(JSON.stringify(samplingPolygonObject))
  }

  return getItems()
}

SamplingPolygonEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
}

export default SamplingPolygonEditor
