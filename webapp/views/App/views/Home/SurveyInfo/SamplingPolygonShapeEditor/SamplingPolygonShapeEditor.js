import React from 'react'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

const SamplingPolygonShapeEditor = (props) => {
  const { readOnly, isCircle, onChange } = props

  const i18n = useI18n()

  return (
    <FormItem label={i18n.t('samplingPolygonOptions.shape')}>
      <select value={isCircle} onChange={onChange} disabled={readOnly}>
        <option value={false}>{i18n.t('samplingPolygonOptions.rectangle')}</option>
        <option value={true}>{i18n.t('samplingPolygonOptions.circle')}</option>
      </select>
    </FormItem>
  )
}

SamplingPolygonShapeEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  isCircle: PropTypes.bool,
  onChange: PropTypes.func,
}

export default SamplingPolygonShapeEditor
