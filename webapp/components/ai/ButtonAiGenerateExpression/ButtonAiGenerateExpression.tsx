import { Button } from '@webapp/components/buttons'

type ButtonAiGenerateExpressionProps = {
  disabled?: boolean
  id?: string
  onClick: (...args: any[]) => any
  testId?: string
  variant?: 'contained' | 'outlined' | 'text'
}

const ButtonAiGenerateExpression = (props: ButtonAiGenerateExpressionProps) => {
  const { disabled = false, id, onClick, testId, variant } = props

  return (
    <Button
      className="btn-s btn-ai"
      disabled={disabled}
      iconName="magicWand"
      iconSize={16}
      id={id}
      onClick={onClick}
      testId={testId}
      title="aiExpression.title"
      variant={variant}
    />
  )
}

export default ButtonAiGenerateExpression
