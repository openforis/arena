import { Button, ButtonProps } from './Button'

export const ButtonCancel = (props: ButtonProps) => {
  const { iconClassName = 'icon-cross icon-12px', label = 'common.cancel', variant = 'text', ...otherProps } = props
  return (
    <Button
      className={`btn-cancel btn-secondary ${props.className ?? ''}`}
      iconClassName={iconClassName}
      label={label}
      variant={variant}
      {...otherProps}
    />
  )
}
