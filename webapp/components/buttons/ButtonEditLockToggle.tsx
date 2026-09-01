import { Button, ButtonProps } from './Button'

type ButtonEditLockToggleProps = ButtonProps & {
  locked: boolean
}

export const ButtonEditLockToggle = (props: ButtonEditLockToggleProps) => {
  const { locked, ...otherProps } = props
  return (
    <Button
      {...otherProps}
      iconClassName={locked ? 'icon-lock' : 'icon-unlocked'}
      label={`common.${locked ? 'unlock' : 'lock'}`}
      variant="text"
    />
  )
}
