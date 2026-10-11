import { useCallback, useState } from 'react'

import { downloadBlob } from '@webapp/components/MapContainer/workspace/screenshot/downloadBlob'
import { ensurePngFileName } from '@webapp/components/MapContainer/workspace/screenshot/screenshotFileName'
import type {
  ScreenshotNotice,
  ScreenshotSaveOutcome,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'
import type { ScreenshotDialogState } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotDialogState'
import type { ScreenshotPreview } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotPreview'
import {
  useScreenshotSave,
  type ScreenshotReplacePrompt,
} from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotSave'

// shown inside the dialog: app notifications are hidden while the map workspace is in full screen
export type ScreenshotDoneNotice = { key: string; params: Record<string, string>; pending: boolean }

/**
 * Reacts to the save outcome: the "saved" (or "still being updated") notice in the dialog, or an inline error.
 * @param {object} params - The parameters.
 * @param {ScreenshotSaveOutcome} params.outcome - The outcome.
 * @param {string} params.plotLabel - Label of the plot.
 * @param {string} params.attributeLabel - Label of the image attribute.
 * @param {Function} params.setDone - Shows the done notice (the footer then only offers Close).
 * @param {Function} params.setActionError - Shows an inline error.
 * @returns {void}
 */
const handleSaveOutcome = ({
  outcome,
  plotLabel,
  attributeLabel,
  setDone,
  setActionError,
}: {
  outcome: ScreenshotSaveOutcome
  plotLabel: string
  attributeLabel: string
  setDone: (done: ScreenshotDoneNotice) => void
  setActionError: (notice: ScreenshotNotice | null) => void
}): void => {
  if (outcome.status === 'saved') {
    setDone({
      key: 'mapWorkspace.screenshot.saved',
      params: { plot: plotLabel, attribute: attributeLabel },
      pending: false,
    })
  } else if (outcome.status === 'pending') {
    setDone({ key: 'mapWorkspace.screenshot.savedPending', params: { plot: plotLabel }, pending: true })
  } else if (outcome.status === 'error') {
    setActionError({ key: outcome.key, params: outcome.params, blocking: false })
  }
}

/**
 * Provides the dialog actions: download only, also download, save to the plot record.
 * @param {object} params - The parameters.
 * @param {ScreenshotDialogState} params.state - The dialog state.
 * @param {ScreenshotPreview} params.preview - The preview (the PNG).
 * @param {Function} params.onClose - Closes the dialog (after "Download PNG").
 * @returns {object} The actions, the saving flag, the replace prompt, the inline error and the done notice.
 */
export const useScreenshotActions = ({
  state,
  preview,
  onClose,
}: {
  state: ScreenshotDialogState
  preview: ScreenshotPreview
  onClose: () => void
}): {
  downloadOnly: () => void
  alsoDownload: () => void
  saveToRecord: () => void
  clearActionError: () => void
  saving: boolean
  replacePrompt: ScreenshotReplacePrompt
  answerReplace: (replace: boolean) => void
  actionError: ScreenshotNotice | null
  done: ScreenshotDoneNotice | null
} => {
  const { save, saving, replacePrompt, answerReplace } = useScreenshotSave()
  const [actionError, setActionError] = useState<ScreenshotNotice | null>(null)
  const [done, setDone] = useState<ScreenshotDoneNotice | null>(null)
  const { blob } = preview
  const { attribute, defaultFileName, fileName, plot } = state

  const downloadOnly = useCallback(() => {
    if (!blob) return
    downloadBlob(blob, ensurePngFileName(defaultFileName))
    onClose()
  }, [blob, defaultFileName, onClose])

  const alsoDownload = useCallback(() => {
    const name = ensurePngFileName(fileName)
    if (!name) {
      setActionError({ key: 'mapWorkspace.screenshot.errors.fileNameRequired', blocking: false })
      return
    }
    if (blob) downloadBlob(blob, name)
  }, [blob, fileName])

  const clearActionError = useCallback(() => setActionError(null), [])

  const saveToRecord = useCallback(() => {
    const name = ensurePngFileName(fileName)
    if (!name) {
      setActionError({ key: 'mapWorkspace.screenshot.errors.fileNameRequired', blocking: false })
      return
    }
    if (!blob || !plot || !attribute) return
    setActionError(null)
    save({ plot, attribute, blob, fileName: name }).then((outcome) =>
      handleSaveOutcome({
        outcome,
        plotLabel: plot.label,
        attributeLabel: attribute.label,
        setDone,
        setActionError,
      })
    )
  }, [attribute, blob, fileName, plot, save])

  return {
    downloadOnly,
    alsoDownload,
    saveToRecord,
    clearActionError,
    saving,
    replacePrompt,
    answerReplace,
    actionError,
    done,
  }
}
