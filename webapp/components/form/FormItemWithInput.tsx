import { useMemo, type ComponentProps } from 'react'

import { useIsMobile } from '../hooks/useIsMobile'
import { FormItem, Input } from './Input'
import type { ArenaValidation } from '@openforis/arena-core'

type FormItemWithInputProps = ComponentProps<typeof Input> & {
  label?: string
  labelParams?: Record<string, any>
  validation?: ArenaValidation
}

export const FormItemWithInput = (props: FormItemWithInputProps) => {
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
