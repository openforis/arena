
import { Button, ButtonProps } from './Button'

export const ButtonIconView = (props: ButtonProps) => {
  const { label = 'common.view', showLabel = false } = props
  return <Button {...props} iconClassName="icon-eye icon-14px" label={label} showLabel={showLabel} />
}
