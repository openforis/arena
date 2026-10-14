import './AiBatchProgressDialog.scss'

import React from 'react'

import type { AiBatchProgress } from '@webapp/ai/workflows/batchRun'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import ProgressBar from '@webapp/components/progressBar'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

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
 * @returns {React.ReactElement} The status.
 */
const ProgressStatus = ({ progress }: { progress: AiBatchProgress | null }) => {
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
    </div>
  )
}

/**
 * Progress of a browser AI batch, with Cancel; on error, the message and Close.
 * @param {Props} props - The run state and the close callback (cancels a running batch).
 * @returns {React.ReactElement} The dialog.
 */
export const AiBatchProgressDialog = ({ run, onClose }: Props) => {
  const { titleKey, progress, error } = run
  return (
    <Modal className="ai-batch-progress-dialog" onClose={onClose} title={titleKey}>
      <ModalBody>
        {error ? (
          <div className="ai-batch-progress-dialog__error" data-testid={TestId.ai.batchError} role="alert">
            {error}
          </div>
        ) : (
          <ProgressStatus progress={progress} />
        )}
      </ModalBody>
      <ModalFooter>
        {error ? (
          <Button label="common.close" onClick={onClose} testId={TestId.ai.batchClose} variant="contained" />
        ) : (
          <Button label="common.cancel" onClick={onClose} testId={TestId.ai.batchCancel} variant="outlined" />
        )}
      </ModalFooter>
    </Modal>
  )
}
