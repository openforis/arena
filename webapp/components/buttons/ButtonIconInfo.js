import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Tooltip } from '@mui/material'

import { useI18n } from '@webapp/store/system'

import { Button } from './Button'
import Markdown from '../markdown'

export const ButtonIconInfo = (props) => {
  const { className: classNameProp, title: titleProp, markdown, ...otherProps } = props

  const i18n = useI18n()
  const className = classNames('btn-transparent', classNameProp)
  const title = i18n.t(titleProp)

  return (
    <Tooltip title={markdown ? <Markdown source={title} /> : title}>
      <Button {...otherProps} className={className} iconClassName="icon-info icon-14px" />
    </Tooltip>
  )
}

ButtonIconInfo.propTypes = {
  markdown: PropTypes.bool,
  ...Button.propTypes,
}

ButtonIconInfo.defaultProps = {
  useMarkdown: false,
  ...Button.defaultProps,
}
