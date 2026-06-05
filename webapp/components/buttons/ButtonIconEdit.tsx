
import { Button, ButtonProps } from './Button'

export const ButtonIconEdit = (props: ButtonProps) => {
  const { label = 'common.edit', showLabel = false, variant = 'text' } = props
  return (
    <Button {...props} iconClassName="icon-pencil2 icon-16px" label={label} showLabel={showLabel} variant={variant} />
  )
}
