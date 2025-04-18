import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { Button } from '@webapp/components'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import Markdown from '@webapp/components/markdown'
import JobErrors from '@webapp/views/App/JobMonitor/JobErrors'

const determineContentKey = ({ jobType, dryRun, includeFiles, hasErrors }) => {
  const action = dryRun ? 'validation' : 'import'
  const status = hasErrors ? 'WithErrors' : 'Successfully'
  const actionSuffix = includeFiles ? 'WithFiles' : ''
  return `dataImportView.jobs.${jobType}.${action}${actionSuffix}Complete${status}`
}

const cleanupContent = ({ content }) => {
  const parts = content.split('\n')
  const nonZeroParts = parts.filter((part) => !part.trim().startsWith('- 0 '))
  return nonZeroParts.join('\n')
}

export const DataImportCompleteDialog = (props) => {
  const { errorsExportFileName, job, onClose } = props

  const i18n = useI18n()

  const jobResult = JobSerialized.getResult(job)
  const { dryRun, includeFiles } = jobResult
  const errorsCount = JobSerialized.getErrorsCount(job)
  const hasErrors = errorsCount > 0
  const errorsFoundMessage = i18n.t('common.errorFound', { count: errorsCount })

  const contentKey = determineContentKey({ jobType: job.type, dryRun, includeFiles, hasErrors })
  const content = i18n.t(contentKey, { ...jobResult, errorsFoundMessage })
  const contentCleaned = cleanupContent({ content })

  return (
    <Modal className={classNames('data-import_complete-dialog', { 'with-errors': hasErrors })} onClose={onClose}>
      <ModalBody>
        <Markdown source={contentCleaned} />
        {hasErrors && (
          <JobErrors
            errorKeyHeaderName="dataImportView.errors.rowNum"
            exportFileName={errorsExportFileName}
            job={job}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}

DataImportCompleteDialog.propTypes = {
  errorsExportFileName: PropTypes.string,
  job: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
}
