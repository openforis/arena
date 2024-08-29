import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import { ButtonGroup } from '@webapp/components/form'

const SamplingPolygonShapeEditor = (props) => {
  const { readOnly, isCircle, onChange } = props

  const i18n = useI18n()

  return (
    <FormItem label={i18n.t('samplingPolygonOptions.shape')}>
      <ButtonGroup
        disabled={readOnly}
        items={['true', 'false'].map((value) => ({
          key: value,
          label: i18n.t(`samplingPolygonOptions.${value === 'true' ? 'circle' : 'rectangle'}`),
        }))}
        onChange={onChange}
        selectedItemKey={String(isCircle)}
      />
    </FormItem>
  )
}

SamplingPolygonShapeEditor.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  isCircle: PropTypes.bool,
  onChange: PropTypes.func,
}

export default SamplingPolygonShapeEditor
