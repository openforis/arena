import React from 'react'
import classNames from 'classnames'

import * as JobSerialized from '@common/job/jobSerialized'

import { Button } from '@webapp/components'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import Markdown from '@webapp/components/markdown'
import JobErrors from '@webapp/views/App/JobMonitor/JobErrors'

const determineContentKey = ({ jobType, dryRun, hasErrors }) => {
  const action = dryRun ? 'validation' : 'import'
  const status = hasErrors ? 'WithErrors' : 'Successfully'
  return `dataImportView.jobs.${jobType}.${action}Complete${status}`
}

export const DataImportCompleteDialog = (props) => {
  const { job, onClose } = props

  const i18n = useI18n()

  const jobResult = JobSerialized.getResult(job)
  const { dryRun } = jobResult
  const errorsCount = JobSerialized.getErrorsCount(job)
  const hasErrors = errorsCount > 0
  const errorsFoundMessage = i18n.t('common.errorFound', { count: errorsCount })

  const contentKey = determineContentKey({ jobType: job.type, dryRun, hasErrors })
  const content = i18n.t(contentKey, { ...jobResult, errorsFoundMessage })

  return (
    <Modal className={classNames('data-import_complete-dialog', { 'with-errors': hasErrors })} onClose={onClose}>
      <ModalBody>
        <Markdown source={content} />
        {hasErrors && <JobErrors errorKeyHeaderName="dataImportView.errors.rowNum" job={job} />}
      </ModalBody>
      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}
