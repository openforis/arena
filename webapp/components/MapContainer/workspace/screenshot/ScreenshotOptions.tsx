import React from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type {
  ScreenshotCaptureMode,
  ScreenshotOptions,
  ScreenshotTarget,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

const PREFIX = 'mapWorkspace.screenshot'

const CAPTURE_MODES: Array<{ mode: ScreenshotCaptureMode; labelKey: string }> = [
  { mode: 'view', labelKey: `${PREFIX}.captureView` },
  { mode: 'plot', labelKey: `${PREFIX}.capturePlot` },
]

const INCLUDES: Array<{ option: 'includeData' | 'includeScale' | 'includeStamp'; testKey: string; labelKey: string }> =
  [
    { option: 'includeData', testKey: 'data', labelKey: `${PREFIX}.includeData` },
    { option: 'includeScale', testKey: 'scale', labelKey: `${PREFIX}.includeScale` },
    { option: 'includeStamp', testKey: 'stamp', labelKey: `${PREFIX}.includeStamp` },
  ]

const TARGETS: Array<{ target: ScreenshotTarget; labelKey: string; hintKey: string }> = [
  { target: 'record', labelKey: `${PREFIX}.targetRecord`, hintKey: `${PREFIX}.targetRecordHint` },
  { target: 'file', labelKey: `${PREFIX}.targetFile`, hintKey: `${PREFIX}.targetFileHint` },
]

type ScreenshotOptionsFieldsProps = {
  options: ScreenshotOptions
  onOptionChange: <K extends keyof ScreenshotOptions>(key: K, value: ScreenshotOptions[K]) => void
  target: ScreenshotTarget
  onTargetChange: (target: ScreenshotTarget) => void
  hasPlots: boolean
}

/**
 * Renders the Capture, Include and Save to fields of the screenshot dialog (mockup ScreenshotDialog).
 * @param {object} props - The props.
 * @param {ScreenshotOptions} props.options - The options.
 * @param {Function} props.onOptionChange - Changes an option.
 * @param {ScreenshotTarget} props.target - Where the image goes.
 * @param {Function} props.onTargetChange - Changes the target.
 * @param {boolean} props.hasPlots - Whether plots are on the map (attach and fit to plot need one).
 * @returns {React.ReactElement} The fields.
 */
export const ScreenshotOptionsFields = ({
  options,
  onOptionChange,
  target,
  onTargetChange,
  hasPlots,
}: ScreenshotOptionsFieldsProps): React.ReactElement => {
  const i18n = useI18n()
  return (
    <>
      <div className="map-screenshot-dialog__grid">
        <fieldset className="map-screenshot-dialog__fieldset">
          <legend>{i18n.t(`${PREFIX}.capture`)}</legend>
          <div className="map-screenshot-dialog__segmented">
            {CAPTURE_MODES.map(({ mode, labelKey }) => (
              <button
                key={mode}
                type="button"
                className="map-screenshot-dialog__segment"
                aria-pressed={options.capture === mode}
                data-testid={TestId.mapWorkspace.screenshotCapture(mode)}
                disabled={mode === 'plot' && !hasPlots}
                onClick={() => onOptionChange('capture', mode)}
              >
                {i18n.t(labelKey)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="map-screenshot-dialog__fieldset">
          <legend>{i18n.t(`${PREFIX}.include`)}</legend>
          {INCLUDES.map(({ option, testKey, labelKey }) => (
            <label key={option} className="map-screenshot-dialog__check">
              <input
                type="checkbox"
                checked={options[option]}
                data-testid={TestId.mapWorkspace.screenshotInclude(testKey)}
                onChange={(event) => onOptionChange(option, event.target.checked)}
              />
              {i18n.t(labelKey)}
            </label>
          ))}
        </fieldset>
      </div>
      <fieldset className="map-screenshot-dialog__fieldset">
        <legend>{i18n.t(`${PREFIX}.saveTo`)}</legend>
        <div className="map-screenshot-dialog__targets">
          {TARGETS.map(({ target: targetKey, labelKey, hintKey }) => (
            <button
              key={targetKey}
              type="button"
              className={classNames('map-screenshot-dialog__target')}
              aria-pressed={target === targetKey}
              data-testid={TestId.mapWorkspace.screenshotTarget(targetKey)}
              disabled={targetKey === 'record' && !hasPlots}
              onClick={() => onTargetChange(targetKey)}
            >
              <span className="map-screenshot-dialog__target-label">{i18n.t(labelKey)}</span>
              <span className="map-screenshot-dialog__target-hint">{i18n.t(hintKey)}</span>
            </button>
          ))}
        </div>
        {!hasPlots && <p className="map-screenshot-dialog__hint">{i18n.t(`${PREFIX}.noPlots`)}</p>}
      </fieldset>
    </>
  )
}
