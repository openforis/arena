import { Button, ButtonProps } from './Button'

export const ButtonIconCancel = (props: ButtonProps) => {
  const { className = 'btn-cancel', label = 'common.cancel', showLabel = false, variant = 'text' } = props
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
