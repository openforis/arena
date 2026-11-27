import { Button, ButtonProps } from './Button'

export const ButtonCancel = (props: ButtonProps) => {
  const { label = 'common.cancel', variant = 'text', ...otherProps } = props
  return (
    <Button
      className={`btn-cancel btn-secondary ${props.className ?? ''}`}
      iconName="close"
      iconSize={14}
      label={label}
      variant={variant}
      {...otherProps}
    />
  )
}
