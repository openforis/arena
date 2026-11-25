import classNames from 'classnames'
import { useNavigate } from 'react-router'

import { Button, ButtonProps } from './Button'

type ButtonBackProps = Omit<ButtonProps, 'onClick'>

export const ButtonBack = (props: ButtonBackProps) => {
  const { className, label = 'common.back', ...otherProps } = props

  const navigate = useNavigate()

  return (
    <Button
      {...otherProps}
      className={classNames('btn-secondary btn-back', className)}
      label={label}
      onClick={() => navigate(-1)}
      variant="outlined"
    />
  )
}
