import React from 'react'
import classNames from 'classnames'

import * as JobSerialized from '@common/job/jobSerialized'

import { Button } from '@webapp/components'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import Markdown from '@webapp/components/markdown'
import JobErrors from '@webapp/views/App/JobMonitor/JobErrors'

export const DataImportCompleteDialog = (props) => {
  const { job, onClose } = props

  const i18n = useI18n()

  const importCompleteResult = JobSerialized.getResult(job)
  const hasErrors = JobSerialized.hasErrors(job)

  const content = i18n.t(
    hasErrors ? 'dataImportView.importCompleteWithErrors' : 'dataImportView.importCompleteSuccessfully',
    importCompleteResult
  )

  return (
    <Modal className={classNames('data-import_complete-dialog', { 'with-errors': hasErrors })} onClose={onClose}>
      <ModalBody>
        <Markdown source={content} />
        {hasErrors && <JobErrors job={job} />}
      </ModalBody>
      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}
