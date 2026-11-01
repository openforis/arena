import './ResizableModal.scss'

import React, { type ReactNode, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button, ButtonIconClose } from '../buttons'

const MIN_WIDTH = 200
const MIN_HEIGHT = 100
const KEYBOARD_STEP = 20

const ARROW_DELTAS: Record<string, { x: number; y: number }> = {
  ArrowDown: { x: 0, y: KEYBOARD_STEP },
  ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
  ArrowRight: { x: KEYBOARD_STEP, y: 0 },
  ArrowUp: { x: 0, y: -KEYBOARD_STEP },
}

export interface ResizableModalState {
  height: number
  left: number
  top: number
  width: number
}

interface ResizableModalProps {
  children?: ReactNode
  className?: string
  header?: ReactNode
  initHeight?: number
  initWidth?: number
  left?: number
  onClose?: (params: { modalState: ResizableModalState }) => void
  onDetach?: () => void
  onRequestClose: () => void
  top?: number
}

/**
 * Calls onMove on every mouse move until the mouse button is released.
 *
 * @param {Function} onMove - The mouse move listener.
 */
const trackMouseMove = (onMove: (event: MouseEvent) => void): void => {
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onMouseUp)
}

export const ResizableModal = (props: ResizableModalProps) => {
  const {
    children,
    className,
    header: headerProp,
    initHeight = 400,
    initWidth = 600,
    left,
    onClose,
    onDetach,
    onRequestClose,
    top,
  } = props

  const [modalState, setModalState] = useState<ResizableModalState>(() => ({
    height: initHeight,
    left: left ?? window.innerWidth / 2 - initWidth / 2 - 21,
    top: top ?? window.innerHeight / 2 - initHeight / 2 - 50,
    width: initWidth,
  }))
  const modalStateRef = useRef(modalState)
  const i18n = useI18n()
  const header = typeof headerProp === 'string' ? i18n.t(headerProp) : headerProp

  useEffect(() => {
    modalStateRef.current = modalState
  }, [modalState])

  useEffect(() => {
    if (!onClose) return undefined
    return () => {
      onClose({ modalState: modalStateRef.current })
    }
  }, [onClose])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.ctrlKey) {
        onRequestClose()
        return
      }
      const delta = ARROW_DELTAS[event.key]
      if (!delta) return
      // Ctrl + arrow resizes the modal, arrow moves it
      setModalState((state) =>
        event.ctrlKey
          ? { ...state, height: state.height + delta.y, width: state.width + delta.x }
          : { ...state, left: state.left + delta.x, top: state.top + delta.y }
      )
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onRequestClose])

  const onDragStart = (startEvent: React.MouseEvent) => {
    if (startEvent.button !== 0) return
    startEvent.preventDefault()
    const { pageX: startX, pageY: startY } = startEvent
    const { left: startLeft, top: startTop } = modalState
    trackMouseMove(({ pageX, pageY }) =>
      setModalState((state) => ({ ...state, left: startLeft + pageX - startX, top: startTop + pageY - startY }))
    )
  }

  const onResizeStart = (startEvent: React.MouseEvent) => {
    if (startEvent.button !== 0) return
    startEvent.preventDefault()
    const { pageX: startX, pageY: startY } = startEvent
    const { height: startHeight, width: startWidth } = modalState
    trackMouseMove(({ pageX, pageY }) =>
      setModalState((state) => ({
        ...state,
        height: Math.max(MIN_HEIGHT, startHeight + pageY - startY),
        width: Math.max(MIN_WIDTH, startWidth + pageX - startX),
      }))
    )
  }

  const { height, left: modalLeft, top: modalTop, width } = modalState

  return (
    <div className={classNames('resizable-modal', className)}>
      {/* mouse-only: the keyboard equivalents (Esc, arrows, Ctrl + arrows) are handled at document level */}
      <div aria-hidden="true" className="flexible-modal-mask" onClick={onRequestClose} />
      <div className="flexible-modal" style={{ height, left: modalLeft, top: modalTop, width }}>
        <div className="resizable-modal__header">
          <h3>{header}</h3>
          {onDetach && (
            <Button
              className="btn-s detach-btn"
              iconClassName="icon-display icon-10px"
              onClick={onDetach}
              title="common.openInNewWindow"
            />
          )}
          {onRequestClose && <ButtonIconClose onClick={onRequestClose} />}
        </div>
        <div className="resizable-modal__body">{children}</div>
        <div aria-hidden="true" className="flexible-modal-drag-area" onMouseDown={onDragStart} />
        <div aria-hidden="true" className="flexible-modal-resizer" onMouseDown={onResizeStart} />
      </div>
    </div>
  )
}
