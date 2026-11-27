import { Button, ButtonProps } from './Button'

export const ButtonInvite = (props: ButtonProps) => {
  const { label = 'userView.sendNewInvitation', variant = 'contained', ...otherProps } = props
  return <Button {...otherProps} iconName="mail" iconSize={14} label={label} variant={variant} />
}
