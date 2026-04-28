import './TooltipNew.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Tooltip } from '@mui/material'

import { Objects } from '@openforis/arena-core'

import { useI18nT } from '@webapp/store/system'

import Markdown from '../markdown'

export const TooltipNew = (props) => {
  const {
    children,
    className,
    closeOnClick = false,
    isTitleMarkdown,
    markdownClassName,
    maxWidth,
    title: titleProp,
    renderTitle,
  } = props

  const t = useI18nT()
  const tUnescapeHtml = useI18nT({ unescapeHtml: true })

  const defaultTitleRenderer = useCallback(() => {
    if (Objects.isEmpty(titleProp)) return null
    const titleText = t(titleProp)
    if (isTitleMarkdown) {
      return <Markdown className={markdownClassName} source={titleText} />
    }
    return tUnescapeHtml(titleText)
  }, [isTitleMarkdown, t, tUnescapeHtml, titleProp, markdownClassName])

  const titleRenderer = renderTitle ?? defaultTitleRenderer

  const [open, setOpen] = useState(false)
  const [openSuppressed, setOpenSuppressed] = useState(false)
  const [title, setTitle] = useState(null)

  const onOpen = useCallback(() => {
    if (openSuppressed) return
    setTitle(titleRenderer())
    setOpen(true)
  }, [openSuppressed, titleRenderer])

  const onClose = useCallback(() => {
    setOpen(false)
  }, [])

  const onClickCapture = useCallback(() => {
    if (!closeOnClick) return
    setOpen(false)
    setOpenSuppressed(true)
  }, [closeOnClick])

  const onMouseOutCapture = useCallback(
    (event) => {
      if (!closeOnClick || event.currentTarget.contains(event.relatedTarget)) return
      setOpenSuppressed(false)
    },
    [closeOnClick]
  )

  const onBlurCapture = useCallback(() => {
    if (!closeOnClick) return
    setOpenSuppressed(false)
  }, [closeOnClick])

  const tooltipClass = useMemo(() => ({ popper: classNames('arena-tooltip', className) }), [className])

  return (
    <Tooltip
      arrow
      classes={tooltipClass}
      disableFocusListener={openSuppressed}
      disableHoverListener={openSuppressed}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth,
          },
        },
      }}
      title={title}
    >
      <span onBlurCapture={onBlurCapture} onClickCapture={onClickCapture} onMouseOutCapture={onMouseOutCapture}>
        {children}
      </span>
    </Tooltip>
  )
}

TooltipNew.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  closeOnClick: PropTypes.bool,
  isTitleMarkdown: PropTypes.bool,
  markdownClassName: PropTypes.string,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  renderTitle: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
}
