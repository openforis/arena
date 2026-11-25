import React from 'react'

import * as Validation from '@core/validation/validation'

import ValidationFieldMessages from '@webapp/components/ValidationFieldMessages'
import Tooltip from './Tooltip'
import type { ArenaValidation } from '@openforis/arena-core'

type ValidationTooltipProps = {
  children: React.ReactNode
  className?: string
  id?: string
  insideTable?: boolean
  position?: 'bottom' | 'top'
  showKeys?: boolean
  testId?: string
  validation?: ArenaValidation
}

const ValidationTooltip = (props: ValidationTooltipProps) => {
  const { children, className, id, insideTable, position = 'bottom', showKeys = false, testId, validation } = props

  const isValid = Validation.isValid(validation)

  let type
  if (Validation.isError(validation)) type = 'error'
  else if (Validation.isWarning(validation)) type = 'warning'

  const content = isValid ? null : React.createElement(ValidationFieldMessages, { validation, showKeys })

  const showContent = Validation.isWarning(validation) || Validation.isError(validation)

  return (
    <Tooltip
      className={className}
      id={id}
      insideTable={insideTable}
      messageComponent={content}
      position={position}
      showContent={showContent}
      testId={testId}
      type={type}
    >
      {children}
    </Tooltip>
  )
}

export default ValidationTooltip
