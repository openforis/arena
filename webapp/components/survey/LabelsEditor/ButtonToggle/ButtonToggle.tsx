import { Button } from '@webapp/components/buttons'

type ButtonToggleProps = {
  onClick: (...args: any[]) => any
  open: boolean
}

const ButtonToggle = ({ open, onClick }: ButtonToggleProps) => (
  <Button
    className="btn-s labels-editor__btn-toggle"
    iconClassName={`icon icon-${open ? 'shrink2' : 'enlarge2'} icon-12px`}
    onClick={onClick}
    variant="text"
  />
)

export default ButtonToggle
