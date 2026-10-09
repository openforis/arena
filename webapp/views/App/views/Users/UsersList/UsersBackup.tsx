import './UsersBackup.scss'

import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import {
  Button,
  ButtonDownload,
  ButtonMenu,
  Dropzone,
  Markdown,
  Modal,
  ModalBody,
  ModalFooter,
  RadioButtonGroup,
} from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'

// keep in sync with UsersBackupConflictMode (server)
const conflictModes = ['skip', 'merge', 'overwrite']

const acceptedFiles = { 'application/zip': ['.zip'] }

type ImportSummary = {
  dryRun: boolean
  usersTotal: number
  usersInserted: number
  usersUpdated: number
  usersSkipped: number
  authGroupsAdded: number
  userGroupsAdded: number
  surveysNotFound: string[]
  userGroupsNotFound: string[]
}

const BackupDownloadButton = ({ job }: { job: any }) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const { outputFileName: tempFileName } = job.result
  return (
    <ButtonDownload
      href={API.getUsersBackupDownloadUrl({ tempFileName })}
      onClick={() => dispatch(JobActions.hideJobMonitor())}
      variant="contained"
    />
  )
}

const UsersBackupExportModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const i18n = useI18n()
  const [includePasswords, setIncludePasswords] = useState(true)

  const onStart = useCallback(async () => {
    const job = await API.startUsersBackupExport({ includePasswords })
    onClose()
    dispatch(JobActions.showJobMonitor({ job, closeButton: BackupDownloadButton }))
  }, [dispatch, includePasswords, onClose])

  return (
    <Modal className="users-backup-modal" title="usersView:usersBackup.backupTitle" onClose={onClose} showCloseButton>
      <ModalBody>
        <p>{i18n.t('usersView:usersBackup.backupInfo')}</p>
        <Checkbox
          checked={includePasswords}
          label="usersView:usersBackup.includePasswords"
          onChange={setIncludePasswords}
        />
        {includePasswords && (
          <p className="users-backup-modal__warning">{i18n.t('usersView:usersBackup.passwordsWarning')}</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button className="modal-footer__item" label="usersView:usersBackup.backup" onClick={onStart} primary />
      </ModalFooter>
    </Modal>
  )
}

const ImportSummaryView = ({ summary }: { summary: ImportSummary }) => {
  const i18n = useI18n()
  const { dryRun, surveysNotFound, userGroupsNotFound } = summary
  return (
    <div className="users-backup-modal__summary">
      <strong>
        {i18n.t(dryRun ? 'usersView:usersBackup.summaryDryRun' : 'usersView:usersBackup.summaryImported')}
      </strong>
      <ul>
        {['usersTotal', 'usersInserted', 'usersUpdated', 'usersSkipped', 'authGroupsAdded', 'userGroupsAdded'].map(
          (key) => (
            <li key={key}>{i18n.t(`usersView:usersBackup.summary.${key}`, { count: summary[key] })}</li>
          )
        )}
      </ul>
      {surveysNotFound.length > 0 && (
        <p>{i18n.t('usersView:usersBackup.surveysNotFound', { names: surveysNotFound.join(', ') })}</p>
      )}
      {userGroupsNotFound.length > 0 && (
        <p>{i18n.t('usersView:usersBackup.userGroupsNotFound', { names: userGroupsNotFound.join(', ') })}</p>
      )}
    </div>
  )
}

const UsersBackupImportModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const i18n = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [conflictMode, setConflictMode] = useState(conflictModes[0])
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const onFilesDrop = useCallback((files: File[]) => {
    setFile(files[0] ?? null)
    setSummary(null)
  }, [])

  const onConflictModeChange = useCallback((value: string) => {
    setConflictMode(value)
    setSummary(null)
  }, [])

  const startImport = useCallback(
    async (dryRun: boolean) => {
      if (!file) return
      setSummary(null)
      const job = await API.startUsersBackupImport({ file, conflictMode, dryRun })
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: (jobCompleted: any) => setSummary(jobCompleted.result?.summary ?? null),
        })
      )
    },
    [conflictMode, dispatch, file]
  )

  const imported = summary && !summary.dryRun

  return (
    <Modal className="users-backup-modal" title="usersView:usersBackup.restoreTitle" onClose={onClose} showCloseButton>
      <ModalBody>
        <Markdown className="users-backup-modal__info" source={i18n.t('usersView:usersBackup.restoreInfo')} />
        <Dropzone accept={acceptedFiles} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} disabled={imported} />
        <RadioButtonGroup
          items={conflictModes.map((mode) => ({ key: mode, label: `usersView:usersBackup.conflictMode.${mode}` }))}
          onChange={onConflictModeChange}
          value={conflictMode}
        />
        {summary && <ImportSummaryView summary={summary} />}
      </ModalBody>
      <ModalFooter>
        {imported ? (
          <Button className="modal-footer__item" label="common.close" onClick={onClose} primary />
        ) : (
          <>
            <Button
              className="modal-footer__item"
              disabled={!file}
              label="usersView:usersBackup.validate"
              onClick={() => startImport(true)}
            />
            <Button
              className="modal-footer__item"
              disabled={!file}
              label="usersView:usersBackup.restore"
              onClick={() => startImport(false)}
              primary
            />
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}

export const UsersBackupButtons = () => {
  const [openModal, setOpenModal] = useState<'export' | 'import' | null>(null)
  const closeModal = useCallback(() => setOpenModal(null), [])

  return (
    <>
      <ButtonMenu
        iconClassName="icon-cog icon-14px"
        label="usersView:usersBackup.menu"
        items={[
          {
            key: 'users-backup',
            iconClassName: 'icon-download2 icon-14px',
            label: 'usersView:usersBackup.backup',
            onClick: () => setOpenModal('export'),
          },
          {
            key: 'users-restore',
            iconClassName: 'icon-upload2 icon-14px',
            label: 'usersView:usersBackup.restore',
            onClick: () => setOpenModal('import'),
          },
        ]}
        variant="outlined"
      />
      {openModal === 'export' && <UsersBackupExportModal onClose={closeModal} />}
      {openModal === 'import' && <UsersBackupImportModal onClose={closeModal} />}
    </>
  )
}
