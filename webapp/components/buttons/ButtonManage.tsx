import { Button, ButtonProps } from './Button'

export const ButtonManage = (props: ButtonProps) => {
  const { label = 'common.manage', variant = 'outlined' } = props
  return <Button {...props} iconName="list" iconSize={14} label={label} variant={variant} />
}
