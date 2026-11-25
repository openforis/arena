import './panelRight.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { Button, ButtonIconClose } from '../buttons'

type PanelRightProps = {
  className?: string
  children: React.ReactNode | React.ReactNode[]
  header?: string
  headerParams?: Record<string, unknown>
  onClose: (...args: any[]) => any
  showFooter?: boolean
  width?: string // width of the panel (e.g. '1000px' or '90vw')
}

const PanelRight = (props: PanelRightProps) => {
  const { children, className, header = '', headerParams, onClose, showFooter = false, width = '500px' } = props

  const t = useI18nT()
  const headerText = t(header, headerParams)

  return ReactDOM.createPortal(
    <div
      className={classNames('panel-right', { 'with-footer': showFooter }, className)}
      style={{ width: `min(${width}, 100vw)` }}
    >
      <div className="panel-right__header">
        <div className="btn-close-container">
          <ButtonIconClose className="btn-close" onClick={onClose} testId={TestId.panelRight.closeBtn} />
        </div>
        <div>{headerText}</div>
      </div>
      <div className="panel-right__content">{React.Children.toArray(children)}</div>
      {showFooter && (
        <div className="panel-right__footer">
          <Button className="btn-close-footer" label="common.close" onClick={onClose} primary />
        </div>
      )}
    </div>,
    document.body
  )
}

export default PanelRight
