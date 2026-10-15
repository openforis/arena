import './AiBatchProgressDialog.scss'

import React, { useCallback, useState } from 'react'

import type { AiBatchProgress } from '@webapp/ai/workflows/batchRun'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import ProgressBar from '@webapp/components/progressBar'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { getDismissAction } from './batchDismiss'
import type { AiBatchRunState } from './useAiBatchRun'

type Props = { run: AiBatchRunState; onClose: () => void }

/**
 * Returns the progress of the calls in percent.
 * @param {AiBatchProgress} progress - Calls done and total.
 * @returns {number} The percent.
 */
const toPercent = ({ done, total }: AiBatchProgress): number => (total > 0 ? Math.floor((100 * done) / total) : 0)

/**
 * Progress bar and "N of M AI requests done" (indeterminate until the calls are known).
 * @param {object} props - Props.
 * @param {AiBatchProgress|null} props.progress - Progress.
 * @param {boolean} props.stopping - Whether a stop was requested.
 * @returns {React.ReactElement} The status.
 */
const ProgressStatus = ({ progress, stopping }: { progress: AiBatchProgress | null; stopping: boolean }) => {
  const i18n = useI18n()
  const known = !!progress && progress.total > 0
  return (
    <div className="ai-batch-progress-dialog__status" data-testid={TestId.ai.batchProgress} role="status">
      <ProgressBar indeterminate={!known} progress={known ? toPercent(progress) : 0} showText={false} />
      <span>
        {known
          ? i18n.t('aiBatch.progress', { done: progress.done, total: progress.total })
          : i18n.t('aiBatch.preparing')}
      </span>
      {stopping && <span>{i18n.t('aiBatch.stopping')}</span>}
    </div>
  )
}

const CONFIRM_TEXT_ID = 'ai-batch-confirm-stop-text'

/**
 * Asks to confirm a stop that a backdrop click or Escape started.
 * @param {object} props - Props.
 * @param {Function} props.onStop - Stops the run.
 * @param {Function} props.onKeepRunning - Dismisses the question.
 * @returns {React.ReactElement} The question.
 */
const ConfirmStop = ({ onStop, onKeepRunning }: { onStop: () => void; onKeepRunning: () => void }) => {
  const i18n = useI18n()
  return (
    <div className="ai-batch-progress-dialog__confirm" role="alertdialog" aria-labelledby={CONFIRM_TEXT_ID}>
      <span id={CONFIRM_TEXT_ID}>{i18n.t('aiBatch.confirmStop')}</span>
      <div className="ai-batch-progress-dialog__confirm-buttons">
        <Button
          // the safe answer has the focus, so the question is read and Enter does not stop the run
          autoFocus
          label="aiBatch.keepRunning"
          onClick={onKeepRunning}
          testId={TestId.ai.batchKeepRunning}
          variant="text"
        />
        <Button label="aiBatch.stop" onClick={onStop} testId={TestId.ai.batchStopConfirm} variant="contained" />
      </div>
    </div>
  )
}

/**
 * Progress of a browser AI batch, with Stop (the results so far are kept); on error, the message and Close. A
 * backdrop click or Escape while it runs asks before stopping.
 * @param {Props} props - The run state and the close callback (stops a running batch).
 * @returns {React.ReactElement} The dialog.
 */
export const AiBatchProgressDialog = ({ run, onClose }: Props) => {
  const { titleKey, progress, error, stopping } = run
  const [confirming, setConfirming] = useState(false)

  const asking = confirming && !error && !stopping
  const onKeepRunning = useCallback(() => setConfirming(false), [])

  // Escape or the backdrop while the question is shown answers it with the safe choice
  const onDismiss = useCallback(() => {
    const action = getDismissAction({ error: !!error, asking, stopping })
    if (action === 'close') onClose()
    else if (action === 'keepRunning') onKeepRunning()
    else if (action === 'ask') setConfirming(true)
  }, [asking, error, onClose, onKeepRunning, stopping])

  const onStop = useCallback(() => {
    setConfirming(false)
    onClose()
  }, [onClose])

  return (
    <Modal className="ai-batch-progress-dialog" onDismiss={onDismiss} title={titleKey}>
      <ModalBody>
        {error ? (
          <div className="ai-batch-progress-dialog__error" data-testid={TestId.ai.batchError} role="alert">
            {error}
          </div>
        ) : (
          <ProgressStatus progress={progress} stopping={stopping} />
        )}
        {asking && <ConfirmStop onStop={onStop} onKeepRunning={onKeepRunning} />}
      </ModalBody>
      <ModalFooter>
        {error ? (
          <Button label="common.close" onClick={onClose} testId={TestId.ai.batchClose} variant="contained" />
        ) : (
          <Button
            label="aiBatch.stop"
            onClick={onClose}
            disabled={stopping}
            testId={TestId.ai.batchCancel}
            variant="outlined"
          />
        )}
      </ModalFooter>
    </Modal>
  )
}
