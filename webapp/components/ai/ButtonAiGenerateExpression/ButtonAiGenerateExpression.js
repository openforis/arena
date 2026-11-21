import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

const ButtonAiGenerateExpression = (props) => {
  const { disabled = false, id, onClick, testId, variant } = props

  return (
    <Button
      className="btn-s btn-ai"
      disabled={disabled}
      iconClassName="icon-magic-wand icon-14px"
      id={id}
      onClick={onClick}
      testId={testId}
      title="aiExpression.title"
      variant={variant}
    />
  )
}

ButtonAiGenerateExpression.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
}

export default ButtonAiGenerateExpression
