import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Button } from './Button'
import { TooltipNew } from '../TooltipNew'

export const ButtonIconInfo = (props) => {
  const { className: classNameProp, title, titleUsesMarkdown, ...otherProps } = props

  const className = classNames('btn-transparent', classNameProp)

  return (
    <TooltipNew title={title} titleInMarkdown={titleUsesMarkdown}>
      <Button {...otherProps} className={className} iconClassName="icon-info icon-14px" />
    </TooltipNew>
  )
}

ButtonIconInfo.propTypes = {
  titleUsesMarkdown: PropTypes.bool,
  ...Button.propTypes,
}

ButtonIconInfo.defaultProps = {
  titleUsesMarkdown: false,
  ...Button.defaultProps,
}
