import { Button, ButtonProps } from './Button'

export const ButtonIconClose = (props: ButtonProps) => {
  const {
    className = 'close-btn btn-s',
    label = 'common.close',
    showLabel = false,
    variant = 'text',
    iconSize = 14,
  } = props
  return (
    <Button
      {...props}
      className={className}
      iconName="close"
      iconSize={iconSize}
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}
