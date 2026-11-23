import './TooltipNew.scss'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import classNames from 'classnames'
import { Tooltip } from '@mui/material'

import { Objects } from '@openforis/arena-core'

import { useI18nT } from '@webapp/store/system'

import Markdown from '../markdown'

type TooltipNewProps = {
  children: ReactNode
  className?: string
  closeOnClick?: boolean
  disableFocusListener?: boolean
  isTitleMarkdown?: boolean
  markdownClassName?: string
  maxWidth?: string | number
  renderTitle?: (...args: any[]) => any
  // another element shows the same content: no tooltip meanwhile
  suppressed?: boolean
  title?: string
}

export const TooltipNew = (props: TooltipNewProps) => {
  const {
    children,
    className,
    closeOnClick = false,
    disableFocusListener = false,
    isTitleMarkdown,
    markdownClassName,
    maxWidth,
    title: titleProp,
    renderTitle,
    suppressed = false,
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
      disableFocusListener={openSuppressed || disableFocusListener}
      disableHoverListener={openSuppressed || suppressed}
      onClose={onClose}
      onOpen={onOpen}
      open={open && !suppressed}
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
