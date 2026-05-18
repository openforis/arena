import React, { useMemo } from 'react'

import { useI18n } from '@webapp/store/system'

type FieldsetProps = {
  children: React.ReactNode
  className?: string
  label?: string
}

export const Fieldset = (props: FieldsetProps) => {
  const { children, className, label } = props
  const i18n = useI18n()

  const legendText = useMemo(() => (label ? i18n.t(label) : null), [i18n, label])

  return (
    <fieldset className={className}>
      <legend>{legendText}</legend>
      {children}
    </fieldset>
  )
}
