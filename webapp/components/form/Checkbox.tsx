import './Checkbox.scss'

import { useCallback, type ReactElement } from 'react'
import classNames from 'classnames'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import MuiCheckbox from '@mui/material/Checkbox'
import MuiRadio from '@mui/material/Radio'

import { Objects } from '@openforis/arena-core'

import { useI18n, useI18nT } from '@webapp/store/system'

import { ButtonIconInfo } from '../buttons/ButtonIconInfo'
import ValidationTooltip from '../ValidationTooltip'
import type { ArenaValidation } from '@openforis/arena-core'

type CheckboxProps = {
  // when displayed without label, aligns the checkbox with labelled checkboxes or radio buttons in the same column
  alignWithLabelledControls?: boolean
  className?: string
  id?: string
  checked?: boolean
  controlStyle?: Record<string, any>
  disabled?: boolean
  indeterminate?: boolean
  info?: string
  infoParams?: Record<string, any>
  label?: string | ReactElement
  onChange?: (...args: any[]) => any
  radio?: boolean
  size?: 'small' | 'medium'
  testId?: string
  validation?: ArenaValidation
  value?: string
}

const Checkbox = (props: CheckboxProps) => {
  const {
    alignWithLabelledControls = false,
    className,
    checked = false,
    controlStyle = null,
    disabled = false,
    id = null,
    info,
    infoParams = null,
    indeterminate = false,
    label = null,
    onChange: onChangeProp = null,
    radio = false,
    size = 'medium',
    testId = null,
    validation,
    value,
  } = props

  const i18n = useI18n()
  const t = useI18nT()

  const onChange = useCallback(
    (event) => {
      event.stopPropagation()
      onChangeProp?.(!checked, event)
    },
    [onChangeProp, checked]
  )

  const control = radio ? (
    <MuiRadio
      checked={checked}
      data-testid={testId ?? id}
      data-value={value}
      disabled={disabled}
      onClick={onChange}
      size={size}
      style={controlStyle}
    />
  ) : (
    <MuiCheckbox
      checked={checked}
      data-testid={testId ?? id}
      data-value={value}
      disabled={disabled}
      indeterminate={indeterminate}
      onClick={onChange}
      size={size}
      style={controlStyle}
    />
  )
  return (
    <div
      className={classNames('btn-checkbox', { 'align-with-labelled-controls': alignWithLabelledControls }, className)}
      style={{ justifySelf: 'start' }}
    >
      <ValidationTooltip validation={validation}>
        {Objects.isEmpty(label) ? (
          control
        ) : (
          <MuiFormControlLabel
            className="btn-checkbox-label width100"
            control={control}
            // elements (e.g. node definition labels) are shown as they are
            label={typeof label === 'string' ? t(label) : label}
          />
        )}
        {info && i18n.exists(info) && <ButtonIconInfo className="info-icon-btn" title={t(info, infoParams)} />}
      </ValidationTooltip>
    </div>
  )
}

export default Checkbox
