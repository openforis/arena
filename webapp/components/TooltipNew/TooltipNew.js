import './TooltipNew.scss'

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Tooltip } from '@mui/material'

import { useI18n } from '@webapp/store/system'

import Markdown from '../markdown'

export const TooltipNew = (props) => {
  const { children, className, titleInMarkdown, title: titleProp, renderTitle } = props

  const i18n = useI18n()

  const defaultTitleRenderer = useCallback(() => {
    const titleText = i18n.t(titleProp)
    return titleInMarkdown ? <Markdown source={titleText} /> : titleText
  }, [i18n, titleInMarkdown, titleProp])

  const titleRenderer = renderTitle ?? defaultTitleRenderer

  const [title, setTitle] = useState(null)

  const onOpen = useCallback(() => {
    setTitle(titleRenderer())
  }, [titleRenderer])

  return (
    <Tooltip arrow classes={{ popper: classNames('arena-tooltip', className) }} onOpen={onOpen} title={title}>
      {children}
    </Tooltip>
  )
}

TooltipNew.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  renderTitle: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleInMarkdown: PropTypes.bool,
}
