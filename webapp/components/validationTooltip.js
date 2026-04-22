import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'

import ValidationFieldMessages from '@webapp/components/validationFieldMessages'
import Tooltip from './tooltip'

const ValidationTooltip = (props) => {
  const { children, className, id, insideTable, position = 'bottom', showKeys = false, testId, validation } = props

  const isValid = Validation.isValid(validation)

  const type = Validation.isError(validation) ? 'error' : Validation.isWarning(validation) ? 'warning' : undefined

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

ValidationTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  id: PropTypes.string,
  insideTable: PropTypes.bool,
  position: PropTypes.oneOf(['bottom', 'top']),
  showKeys: PropTypes.bool,
  testId: PropTypes.string,
  validation: PropTypes.object,
}

export default ValidationTooltip
