import './MobilePreviewPanel.scss'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'

import { ENV } from '@core/processUtils'

import { Button, ButtonIconInfo } from '@webapp/components/buttons'
import { ButtonGroup } from '@webapp/components/form'
import { useOnResize } from '@webapp/components/hooks'
import PanelRight from '@webapp/components/PanelRight'
import * as API from '@webapp/service/api'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'

import { MobilePreviewMessageType, MobilePreviewProtocol } from './mobilePreviewProtocol'

const deviceSizes = {
  phone: { width: 360, height: 740 },
  tablet: { width: 768, height: 1024 },
} as const

type Device = keyof typeof deviceSizes
type Orientation = 'portrait' | 'landscape'

const devices: Device[] = ['phone', 'tablet']
const deviceIconClassName: Record<Device, string> = { phone: 'icon-mobile', tablet: 'icon-tablet' }
const orientations: Orientation[] = ['portrait', 'landscape']

// panel padding (and some margin) around the device frame
const panelExtraWidth = 60
// device frame border width (see MobilePreviewPanel.scss)
const frameBorderWidth = 10

const getFrameSize = ({ device, orientation }: { device: Device; orientation: Orientation }) => {
  const { width, height } = deviceSizes[device]
  return orientation === 'portrait' ? { width, height } : { width: height, height: width }
}

type Props = {
  onClose: () => void
}

export const MobilePreviewPanel = (props: Props) => {
  const { onClose } = props

  const t = useI18nT()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const iframeRef = useRef<HTMLIFrameElement>(null)
  // read when sending the survey: a language change alone doesn't fetch the survey again
  const langRef = useRef(lang)

  const [device, setDevice] = useState<Device>('phone')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  // incremented every time the preview (re)loads and asks for the survey
  const [readyCount, setReadyCount] = useState(0)
  const [reloadCount, setReloadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = ENV.mobilePreviewUrl as string
  const previewOrigin = useMemo(() => MobilePreviewProtocol.getPreviewOrigin(previewUrl), [previewUrl])
  const previewSrc = useMemo(() => MobilePreviewProtocol.getPreviewSrc(previewUrl), [previewUrl])

  const postToPreview = useCallback(
    (message: Record<string, unknown>) => iframeRef.current?.contentWindow?.postMessage(message, previewOrigin),
    [previewOrigin]
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== previewOrigin || event.source !== iframeRef.current?.contentWindow) return
      const { data } = event
      if (!MobilePreviewProtocol.isIncomingMessage(data)) return
      if (data.type === MobilePreviewMessageType.ready) {
        setReadyCount((count) => count + 1)
      } else {
        setError(data.message)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [previewOrigin])

  useEffect(() => {
    if (readyCount === 0) return undefined
    let cancelled = false
    const fetchAndSendSurvey = async () => {
      setLoading(true)
      setError(null)
      try {
        const survey = await API.fetchSurveyForMobile({ surveyId, cycle, draft: true })
        if (cancelled) return
        postToPreview({ type: MobilePreviewMessageType.survey, survey, lang: langRef.current, cycle })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchAndSendSurvey()
    return () => {
      cancelled = true
    }
  }, [cycle, postToPreview, readyCount, reloadCount, surveyId])

  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    postToPreview({ type: MobilePreviewMessageType.lang, lang })
  }, [lang, postToPreview])

  const frameSize = getFrameSize({ device, orientation })

  // the device is scaled down to fit the panel (no scrolling); the iframe keeps the real device size (same layout)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null)
  const onStageResize = useCallback(() => {
    const stage = stageRef.current
    if (stage) setStageSize({ width: stage.clientWidth, height: stage.clientHeight })
  }, [])
  useOnResize(onStageResize, stageRef)

  const outerWidth = frameSize.width + 2 * frameBorderWidth
  const outerHeight = frameSize.height + 2 * frameBorderWidth
  // the stage height doesn't depend on the panel width: the panel is sized to the device scaled to fit the height
  const heightScale = stageSize ? Math.min(1, stageSize.height / outerHeight) : 1
  const scale = stageSize ? Math.min(heightScale, stageSize.width / outerWidth) : 1

  return (
    <PanelRight
      className="mobile-preview-panel"
      header="surveyForm:mobilePreview.title"
      onClose={onClose}
      width={`${Math.ceil(outerWidth * heightScale) + panelExtraWidth}px`}
    >
      <div className="mobile-preview-panel__toolbar">
        <ButtonGroup
          groupName="mobilePreviewDevice"
          items={devices.map((key) => ({
            key,
            iconClassName: deviceIconClassName[key],
            title: `surveyForm:mobilePreview.device.${key}`,
          }))}
          // ButtonGroup (JS) passes the selected item key to onChange, but its inferred type has no params
          onChange={setDevice as () => void}
          selectedItemKey={device}
        />
        <ButtonGroup
          groupName="mobilePreviewOrientation"
          items={orientations.map((key) => ({
            key,
            // no landscape icon: the device icon rotated
            iconClassName: classNames(deviceIconClassName[device], { 'icon-rotate-90': key === 'landscape' }),
            title: `surveyForm:mobilePreview.orientation.${key}`,
          }))}
          onChange={setOrientation as () => void}
          selectedItemKey={orientation}
        />
        <Button
          disabled={loading || readyCount === 0}
          iconClassName="icon-loop2 icon-12px"
          onClick={() => setReloadCount((count) => count + 1)}
          size="small"
          title="surveyForm:mobilePreview.reload"
          variant="outlined"
        />
        <ButtonIconInfo
          isTitleMarkdown
          title={`${t('surveyForm:mobilePreview.note')}\n\n${t('surveyForm:mobilePreview.differences')}`}
          titleIsI18nKey={false}
        />
      </div>
      {error && (
        // React already escapes the text
        <div className="mobile-preview-panel__error">
          {t('surveyForm:mobilePreview.error', { error, interpolation: { escapeValue: false } })}
        </div>
      )}
      <div className="mobile-preview-panel__stage" ref={stageRef}>
        <div style={{ width: outerWidth * scale, height: outerHeight * scale }}>
          <div className="mobile-preview-panel__device" style={{ ...frameSize, transform: `scale(${scale})` }}>
            <iframe ref={iframeRef} src={previewSrc} title={t('surveyForm:mobilePreview.title')} />
          </div>
        </div>
      </div>
    </PanelRight>
  )
}
