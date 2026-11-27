import { Button, ButtonProps } from './Button'

export const ButtonAdd = (props: ButtonProps) => {
  const { label = 'common.add' } = props
  return <Button {...props} iconName="add" iconSize={14} label={label} />
}
