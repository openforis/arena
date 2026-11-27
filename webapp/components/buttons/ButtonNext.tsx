import { Button, ButtonProps } from './Button'

export const ButtonNext = (props: ButtonProps) => {
  const { label = 'common.next' } = props
  return <Button {...props} iconName="arrowForward" iconSize={14} label={label} />
}
