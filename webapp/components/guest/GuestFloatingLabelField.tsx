import type React from 'react'

import { useI18n } from '@webapp/store/system'

type Props = {
  children: React.ReactNode
  // the label is shown on the border only when there is a value (otherwise the placeholder shows it)
  hasValue: boolean
  label: string
}

/**
 * Field (e.g. a dropdown) with a label on the top border once a value is set, like the outlined text inputs.
 */
export const GuestFloatingLabelField = (props: Props) => {
  const { children, hasValue, label } = props
  const i18n = useI18n()
  return (
    <div className="guest-floating-label-field">
      {children}
      {hasValue && <span className="guest-floating-label-field__label">{i18n.t(label)}</span>}
    </div>
  )
}
