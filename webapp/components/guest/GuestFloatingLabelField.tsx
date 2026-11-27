import classNames from 'classnames'
import type React from 'react'

import { useI18n } from '@webapp/store/system'

type Props = {
  children: React.ReactNode
  // the label is shown on the border only when there is a value (otherwise the placeholder shows it)
  hasValue: boolean
  label: string
}

/**
 * Field (e.g. a dropdown) with a label on the top border once a value is set, like the outlined text inputs:
 * the border is drawn by a fieldset whose legend leaves a gap for the label.
 */
export const GuestFloatingLabelField = (props: Props) => {
  const { children, hasValue, label } = props
  const i18n = useI18n()
  const labelText = i18n.t(label)
  return (
    <div className={classNames('guest-floating-label-field', { 'guest-floating-label-field--with-label': hasValue })}>
      {children}
      {hasValue && (
        <>
          <fieldset aria-hidden="true" className="guest-floating-label-field__outline">
            <legend>
              <span>{labelText}</span>
            </legend>
          </fieldset>
          <span className="guest-floating-label-field__label">{labelText}</span>
        </>
      )}
    </div>
  )
}
