import { Button } from '@webapp/components/buttons'

type ButtonToggleProps = {
  onClick: (...args: any[]) => any
  open: boolean
}

const ButtonToggle = ({ open, onClick }: ButtonToggleProps) => (
  <Button
    className="btn-s labels-editor__btn-toggle"
    iconName={open ? 'collapse' : 'expand'}
    iconSize={14}
    onClick={onClick}
    variant="text"
  />
)

export default ButtonToggle
