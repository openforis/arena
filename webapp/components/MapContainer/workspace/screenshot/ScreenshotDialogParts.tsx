import React from 'react'
import classNames from 'classnames'
import DialogActions from '@mui/material/DialogActions'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { PLAIN_TEXT, type ScreenshotNotice } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'
import type { ScreenshotDoneNotice } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotActions'

const PREFIX = 'mapWorkspace.screenshot'

/**
 * Renders the preview of the image that will be saved or downloaded.
 * @param {object} props - The props.
 * @param {string|null} props.url - Object URL of the PNG.
 * @param {boolean} props.loading - Whether a new image is being prepared.
 * @returns {React.ReactElement} The preview.
 */
export const ScreenshotPreviewBox = ({
  url,
  loading,
}: {
  url: string | null
  loading: boolean
}): React.ReactElement => {
  const i18n = useI18n()
  return (
    <div
      className={classNames('map-screenshot-dialog__preview', { 'map-screenshot-dialog__preview--loading': loading })}
    >
      {url ? (
        <img src={url} alt={i18n.t(`${PREFIX}.previewAlt`)} data-testid={TestId.mapWorkspace.screenshotPreview} />
      ) : (
        <span>{i18n.t(`${PREFIX}.previewLoading`)}</span>
      )}
    </div>
  )
}

/**
 * Renders a notice under the preview (tiles left out, Equal Earth, errors).
 * @param {object} props - The props.
 * @param {ScreenshotNotice} props.notice - The notice.
 * @returns {React.ReactElement} The notice line.
 */
export const ScreenshotNoticeLine = ({ notice }: { notice: ScreenshotNotice }): React.ReactElement => {
  const i18n = useI18n()
  return (
    <p
      role="status"
      className={classNames('map-screenshot-dialog__notice', {
        'map-screenshot-dialog__notice--error': notice.blocking,
      })}
      data-testid={TestId.mapWorkspace.screenshotNotice}
    >
      {i18n.t(notice.key, { ...notice.params, ...PLAIN_TEXT })}
    </p>
  )
}

/**
 * Tells inside the dialog that the image was saved (or that the record is still being updated).
 * Notifications would be hidden while the map is in full screen.
 * @param {object} props - The props.
 * @param {ScreenshotDoneNotice} props.done - The done notice.
 * @returns {React.ReactElement} The notice line.
 */
export const ScreenshotDoneLine = ({ done }: { done: ScreenshotDoneNotice }): React.ReactElement => {
  const i18n = useI18n()
  return (
    <p
      role="status"
      className={classNames('map-screenshot-dialog__notice', {
        'map-screenshot-dialog__notice--success': !done.pending,
      })}
      data-testid={TestId.mapWorkspace.screenshotDone}
    >
      {i18n.t(done.key, { ...done.params, ...PLAIN_TEXT })}
    </p>
  )
}

/**
 * Asks inside the dialog whether to replace the image already in the attribute.
 * @param {object} props - The props.
 * @param {string} props.fileName - Name of the current image.
 * @param {Function} props.onAnswer - Called with true to replace, false to keep.
 * @returns {React.ReactElement} The prompt.
 */
export const ScreenshotReplacePrompt = ({
  fileName,
  onAnswer,
}: {
  fileName: string
  onAnswer: (replace: boolean) => void
}): React.ReactElement => {
  const i18n = useI18n()
  return (
    <div className="map-screenshot-dialog__replace" role="alert">
      <span>{i18n.t(`${PREFIX}.confirmReplace`, { fileName, ...PLAIN_TEXT })}</span>
      <Button
        label={`${PREFIX}.replace`}
        variant="contained"
        primary
        testId={TestId.mapWorkspace.screenshotReplace}
        onClick={() => onAnswer(true)}
      />
      <Button
        label={`${PREFIX}.keep`}
        variant="outlined"
        testId={TestId.mapWorkspace.screenshotKeep}
        onClick={() => onAnswer(false)}
      />
    </div>
  )
}

type ScreenshotDialogFooterProps = {
  done: boolean
  toRecord: boolean
  imageReady: boolean
  canSave: boolean
  saving: boolean
  closeDisabled: boolean
  onCancel: () => void
  onAlsoDownload: () => void
  onSubmit: () => void
}

/**
 * Returns the i18n key of the main button.
 * @param {object} params - The parameters.
 * @param {boolean} params.toRecord - Whether the image goes to a record.
 * @param {boolean} params.saving - Whether a save is running.
 * @returns {string} The key.
 */
const getSubmitLabelKey = ({ toRecord, saving }: { toRecord: boolean; saving: boolean }): string => {
  if (!toRecord) return `${PREFIX}.downloadPng`
  // short: the plot is chosen just above, and its label can be long
  return saving ? `${PREFIX}.saving` : 'common.save'
}

/**
 * Renders the dialog buttons: Cancel, Also download (attach only), Save / Download PNG; only Close once saved.
 * @param {object} props - The props.
 * @param {boolean} props.done - Whether the image was saved (only Close is left).
 * @param {boolean} props.toRecord - Whether the image goes to a record.
 * @param {boolean} props.imageReady - Whether the PNG is ready.
 * @param {boolean} props.canSave - Whether saving is possible.
 * @param {boolean} props.saving - Whether a save is running.
 * @param {boolean} props.closeDisabled - Whether Cancel is disabled (saving without a prompt).
 * @param {Function} props.onCancel - Closes the dialog.
 * @param {Function} props.onAlsoDownload - Downloads the PNG too.
 * @param {Function} props.onSubmit - Saves or downloads.
 * @returns {React.ReactElement} The footer.
 */
export const ScreenshotDialogFooter = ({
  done,
  toRecord,
  imageReady,
  canSave,
  saving,
  closeDisabled,
  onCancel,
  onAlsoDownload,
  onSubmit,
}: ScreenshotDialogFooterProps): React.ReactElement => {
  if (done) {
    return (
      <DialogActions className="map-screenshot-dialog__footer">
        <Button
          label="common.close"
          variant="contained"
          primary
          testId={TestId.mapWorkspace.screenshotClose}
          onClick={onCancel}
        />
      </DialogActions>
    )
  }
  return (
    <DialogActions className="map-screenshot-dialog__footer">
      <Button
        label="common.cancel"
        variant="outlined"
        testId={TestId.mapWorkspace.screenshotCancel}
        disabled={closeDisabled}
        onClick={onCancel}
      />
      {toRecord && (
        <Button
          label={`${PREFIX}.alsoDownload`}
          variant="outlined"
          testId={TestId.mapWorkspace.screenshotAlsoDownload}
          disabled={!imageReady}
          onClick={onAlsoDownload}
        />
      )}
      <Button
        label={getSubmitLabelKey({ toRecord, saving })}
        variant="contained"
        primary
        testId={TestId.mapWorkspace.screenshotSubmit}
        disabled={toRecord ? !canSave : !imageReady}
        onClick={onSubmit}
      />
    </DialogActions>
  )
}
