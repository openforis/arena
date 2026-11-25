import type React from 'react'
import ValidationTooltip from '../ValidationTooltip'
import { FormItem } from './Input'
import type { ArenaValidation } from '@openforis/arena-core'

type FormItemWithValidationProps = {
  children: React.ReactNode
  hideLabelInMobile?: boolean
  label?: string
  labelParams?: Record<string, any>
  validation?: ArenaValidation
}

export const FormItemWithValidation = (props: FormItemWithValidationProps) => {
  const { children, hideLabelInMobile, label, labelParams, validation } = props

  return (
    <FormItem hideLabelInMobile={hideLabelInMobile} label={label} labelParams={labelParams}>
      <ValidationTooltip validation={validation}>{children}</ValidationTooltip>
    </FormItem>
  )
}
