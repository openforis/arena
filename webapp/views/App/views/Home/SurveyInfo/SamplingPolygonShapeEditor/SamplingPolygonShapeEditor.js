import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const SamplingPolygonShapeEditor = (props) => {
  const { readOnly, isCircle, onChange } = props

  const i18n = useI18n()

  return (
    <div className="form-item">
      <label className="form-label">Shape</label>
      <select value={isCircle} onChange={onChange} disabled={readOnly}>
        <option value="false">{i18n.t('samplingPolygonOptions.rectangle')}</option>
        <option value="true">{i18n.t('samplingPolygonOptions.circle')}</option>
      </select>
    </div>
  )
}

SamplingPolygonShapeEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  isCircle: PropTypes.bool,
  onChange: PropTypes.func,
}

export default SamplingPolygonShapeEditor
