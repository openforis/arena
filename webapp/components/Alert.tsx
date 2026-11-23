import { useEffect, useRef, useState } from 'react'
import MuiAlert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import { useI18n } from '@webapp/store/system'

type AlertProps = {
  autoDismiss?: boolean
  autoDismissInterval?: number
  severity?: 'error' | 'info' | 'success' | 'warning'
  text: string
  title?: string
  onDismiss?: (...args: any[]) => any
}

export const Alert = (props: AlertProps) => {
  const {
    autoDismiss = false,
    autoDismissInterval = 3000,
    severity = 'info',
    text: textKey,
    title: titleKey,
    onDismiss,
  } = props

  const i18n = useI18n()
  const [show, setShow] = useState(true)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (autoDismiss) {
      timeoutRef.current = setTimeout(() => {
        // After 3 seconds set the show value to false
        setShow(false)
        onDismiss?.()
      }, autoDismissInterval)

      return () => {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [autoDismiss, autoDismissInterval, onDismiss])

  if (!show) {
    return null
  }
  const text = i18n.t(textKey)
  const title = titleKey ? i18n.t(titleKey) : null

  return (
    <MuiAlert severity={severity}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {text}
    </MuiAlert>
  )
}
