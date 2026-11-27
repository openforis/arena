import { Button, ButtonProps } from './Button'

export const ButtonIconGear = (props: ButtonProps) => {
  const { variant = 'text' } = props
  return <Button {...props} iconName="settings" variant={variant} />
}
