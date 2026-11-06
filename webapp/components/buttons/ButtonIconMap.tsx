import { Button, ButtonProps } from './Button'

export const ButtonIconMap = (props: ButtonProps) => {
  const { label = 'surveyForm:nodeDefCoordinate.showOnMap', showLabel = false, variant = 'text' } = props
  return <Button {...props} iconClassName="icon-map icon-16px" label={label} showLabel={showLabel} variant={variant} />
}
