import { Button, ButtonProps } from './Button'

export const ButtonIconAdd = (props: ButtonProps) => {
  const { className = 'btn-add', label = 'common.add', showLabel = false, variant = 'text' } = props
  return (
    <Button
      {...props}
      className={className}
      iconName="add"
      iconSize={14}
      label={label}
      showLabel={showLabel}
      variant={variant}
    />
  )
}
