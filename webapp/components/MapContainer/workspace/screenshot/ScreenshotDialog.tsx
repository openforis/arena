import './ScreenshotDialog.scss'

import React, { useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { ScreenshotAttachFields } from '@webapp/components/MapContainer/workspace/screenshot/ScreenshotAttachFields'
import {
  ScreenshotDialogFooter,
  ScreenshotDoneLine,
  ScreenshotNoticeLine,
  ScreenshotPreviewBox,
  ScreenshotReplacePrompt,
} from '@webapp/components/MapContainer/workspace/screenshot/ScreenshotDialogParts'
import { ScreenshotOptionsFields } from '@webapp/components/MapContainer/workspace/screenshot/ScreenshotOptions'
import type { ScreenshotNotice } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'
import { useScreenshotActions } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotActions'
import { useScreenshotDialogState } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotDialogState'
import {
  useScreenshotPreview,
  type ScreenshotPreview,
} from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotPreview'

const TITLE_ID = 'map-screenshot-title'

/**
 * Chooses the notice to show: the last action error, else the capture notice, else a capture error.
 * @param {object} params - The parameters.
 * @param {ScreenshotNotice|null} params.actionError - Error of the last action.
 * @param {ScreenshotPreview} params.preview - The preview.
 * @returns {ScreenshotNotice|null} The notice.
 */
const getDialogNotice = ({
  actionError,
  preview,
}: {
  actionError: ScreenshotNotice | null
  preview: ScreenshotPreview
}): ScreenshotNotice | null => {
  if (actionError) return actionError
  if (preview.notice) return preview.notice
  if (preview.errorDetails) {
    return {
      key: 'mapWorkspace.screenshot.errors.captureFailed',
      params: { details: preview.errorDetails },
      blocking: true,
    }
  }
  return null
}

/**
 * Map screenshot dialog: preview, capture options, and save to a plot record's image attribute or download.
 * Registered as `screenshot` in Part 1's dialogs host; it takes no props and closes itself.
 * @returns {React.ReactElement} The dialog.
 */
export const ScreenshotDialog = (): React.ReactElement => {
  const { portalContainer, dispatch } = useMapWorkspace()
  const onClose = useCallback(() => dispatch({ type: 'closeDialog' }), [dispatch])
  const i18n = useI18n()
  const state = useScreenshotDialogState()
  const preview = useScreenshotPreview({
    map: state.map,
    options: state.options,
    plot: state.plot,
    fitZoom: state.fitZoom,
    stamp: state.stamp,
  })
  const actions = useScreenshotActions({ state, preview, onClose })
  const { saving, actionError, clearActionError } = actions
  /**
   * Closes the dialog on user request (Cancel, X, Escape, backdrop), except while a save is running.
   * @returns {void}
   */
  const onRequestClose = useCallback(() => {
    if (!saving) onClose()
  }, [onClose, saving])
  /**
   * Changes the file name and clears the previous action error.
   * @param {string} fileName - The new file name.
   * @returns {void}
   */
  const onFileNameChange = (fileName: string): void => {
    if (actionError) clearActionError()
    state.setFileName(fileName)
  }
  const notice = getDialogNotice({ actionError: actions.actionError, preview })
  const imageReady = Boolean(preview.blob) && !preview.loading && !preview.notice?.blocking
  const toRecord = state.target === 'record'
  const canSave = imageReady && !actions.saving && !actions.replacePrompt && Boolean(state.plot && state.attribute)
  const { done } = actions

  return (
    <Dialog
      open
      onClose={onRequestClose}
      container={portalContainer}
      maxWidth="sm"
      fullWidth
      aria-labelledby={TITLE_ID}
    >
      <div className="map-screenshot-dialog" data-testid={TestId.mapWorkspace.screenshotDialog}>
        <DialogTitle id={TITLE_ID} className="map-screenshot-dialog__title">
          {i18n.t('mapWorkspace.screenshot.title')}
          <button
            type="button"
            className="map-screenshot-dialog__close"
            aria-label={i18n.t('common.close')}
            onClick={onRequestClose}
          >
            <span className="icon icon-cross" />
          </button>
        </DialogTitle>
        <DialogContent className="map-screenshot-dialog__content">
          <ScreenshotPreviewBox url={preview.url} loading={preview.loading} />
          {!done && (
            <ScreenshotOptionsFields
              options={state.options}
              onOptionChange={state.setOption}
              target={state.target}
              onTargetChange={state.setTarget}
              hasPlots={state.candidates.length > 0}
            />
          )}
          {toRecord && !done && (
            <ScreenshotAttachFields
              candidates={state.candidates}
              plot={state.plot}
              onPlotChange={state.selectPlot}
              attributeOptions={state.attributeOptions}
              attribute={state.attribute}
              onAttributeChange={state.selectAttribute}
              fileName={state.fileName}
              onFileNameChange={onFileNameChange}
            />
          )}
          {notice && !done && <ScreenshotNoticeLine notice={notice} />}
          {done && <ScreenshotDoneLine done={done} />}
          {actions.replacePrompt && (
            <ScreenshotReplacePrompt fileName={actions.replacePrompt.fileName} onAnswer={actions.answerReplace} />
          )}
        </DialogContent>
        <ScreenshotDialogFooter
          done={Boolean(done)}
          toRecord={toRecord}
          imageReady={imageReady}
          canSave={canSave}
          saving={actions.saving && !actions.replacePrompt}
          plotLabel={state.plot?.label ?? ''}
          onCancel={onRequestClose}
          onAlsoDownload={actions.alsoDownload}
          onSubmit={toRecord ? actions.saveToRecord : actions.downloadOnly}
        />
      </div>
    </Dialog>
  )
}
