
import { ButtonProps } from './Button'
import { ButtonDelete } from './ButtonDelete'

export const ButtonIconDelete = (props: ButtonProps) => {
  const { showLabel = false, size = 'small', variant = 'text' } = props
  return <ButtonDelete {...props} showLabel={showLabel} size={size} variant={variant} />
}
