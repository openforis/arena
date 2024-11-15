import React from 'react'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'
import { ButtonGroup } from '@webapp/components/form'

const buttonGroupItems = ['true', 'false'].map((value) => ({
  key: value,
  label: `samplingPolygonOptions.${value === 'true' ? 'circle' : 'rectangle'}`,
}))

const SamplingPolygonShapeEditor = (props) => {
  const { readOnly, isCircle, onChange } = props

  return (
    <FormItem label="samplingPolygonOptions.shape">
      <ButtonGroup
        disabled={readOnly}
        items={buttonGroupItems}
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
