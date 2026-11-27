import { Button, ButtonProps } from './Button'

export const ButtonIconEdit = (props: ButtonProps) => {
  const { label = 'common.edit', showLabel = false, variant = 'text' } = props
  return <Button {...props} iconName="edit" label={label} showLabel={showLabel} variant={variant} />
}
