import { Button, ButtonProps } from './Button'

export const ButtonIconView = (props: ButtonProps) => {
  const { label = 'common.view', showLabel = false } = props
  return <Button {...props} iconName="view" label={label} showLabel={showLabel} />
}
