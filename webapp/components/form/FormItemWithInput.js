import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useIsMobile } from '../hooks/useIsMobile'
import { FormItem, Input } from './Input'

export const FormItemWithInput = (props) => {
  const { label, labelParams, ...rest } = props

  const isMobile = useIsMobile()

  const inputFieldParams = useMemo(() => {
    const result = { ...rest }
    if (isMobile) {
      Object.assign(result, { label, labelParams })
    }
    return result
  }, [isMobile, label, labelParams, rest])

  return (
    <FormItem hideLabelInMobile label={label} labelParams={labelParams}>
      <Input {...inputFieldParams} />
    </FormItem>
  )
}

FormItemWithInput.propTypes = {
  ...Input.propTypes,
  label: PropTypes.string,
  labelParams: PropTypes.object,
  validation: PropTypes.object,
}
