import { Button, ButtonProps } from './Button'

export const ButtonIconClose = (props: ButtonProps) => {
  const { className = 'close-btn btn-s', label = 'common.close', showLabel = false, variant = 'text' } = props
  return (
    <Button
      {...props}
      className={className}
      iconName="close"
      iconSize={14}
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}
