
import { Button, ButtonProps } from './Button'

export const ButtonIconGear = (props: ButtonProps) => {
  const { variant = 'text' } = props
  return <Button {...props} iconClassName="icon-cog icon-14px" variant={variant} />
}
