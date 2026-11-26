import { Button, ButtonProps } from './Button'

export const ButtonPrevious = (props: ButtonProps) => {
  const { label = 'common.previous' } = props
  return <Button {...props} iconName="arrowBack" iconSize={14} label={label} />
}
