import { Button, ButtonProps } from './Button'

export const ButtonIconAdd = (props: ButtonProps) => {
  const { className = 'btn-add', label = 'common.add', showLabel = false, variant = 'text', iconSize = 14 } = props
  return (
    <Button
      {...props}
      className={className}
      iconName="add"
      iconSize={iconSize}
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}
