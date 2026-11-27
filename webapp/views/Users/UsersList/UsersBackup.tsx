import './UsersBackup.scss'

import { useCallback, useMemo, useState } from 'react'

import * as DateUtils from '@core/dateUtils'
import * as User from '@core/user/user'
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
import { Input } from '@webapp/components/form/Input'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'

import {
  existingUserActions,
  ImportPreviewUser,
  isPasswordRestorable,
  newUserActions,
  UserAction,
  UserActionButtonGroup,
  UsersBackupImportUsersTable,
} from './UsersBackupImportUsersTable'

const acceptedFiles = { 'application/zip': ['.zip'] }

type ImportSummary = {
  usersTotal: number
  usersInserted: number
  usersUpdated: number
  usersSkipped: number
  authGroupsAdded: number
  userGroupsAdded: number
  surveysNotFound: string[]
  userGroupsNotFound: string[]
}

type ImportPreview = {
  tempFileName: string
  info: { serverUrl?: string; dateExported: string; exportedByUserEmail: string; includePasswords: boolean }
  users: ImportPreviewUser[]
}

const defaultUserAction = (user: ImportPreviewUser) => (user.existing ? UserAction.skip : UserAction.insert)

const BackupDownloadButton = ({ job }: { job: any }) => {
  const dispatch = useAppDispatch()
  const { outputFileName: tempFileName } = job.result
  return (
    <ButtonDownload
      href={API.getUsersBackupDownloadUrl({ tempFileName })}
      onClick={() => dispatch(JobActions.hideJobMonitor())}
      variant="contained"
    />
  )
}

const ExportScope = {
  all: 'all',
  selected: 'selected',
  emails: 'emails',
} as const

type ExportScopeType = (typeof ExportScope)[keyof typeof ExportScope]

// emails can be separated by new lines, commas, semicolons or spaces
const parseEmails = (text: string): string[] => [
  ...new Set(
    text
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean)
  ),
]

const getEmailsToExport = ({
  scope,
  selectedUsers,
  emailsText,
}: {
  scope: ExportScopeType
  selectedUsers: any[]
  emailsText: string
}): string[] | null => {
  if (scope === ExportScope.selected) return selectedUsers.map((user) => User.getEmail(user))
  if (scope === ExportScope.emails) return parseEmails(emailsText)
  return null
}

const UsersBackupExportModal = ({ onClose, selectedUsers }: { onClose: () => void; selectedUsers: any[] }) => {
  const dispatch = useAppDispatch()
  const i18n = useI18n()
  const [includePasswords, setIncludePasswords] = useState(true)
  const [scope, setScope] = useState<ExportScopeType>(selectedUsers.length > 0 ? ExportScope.selected : ExportScope.all)
  const [emailsText, setEmailsText] = useState('')

  const emails = getEmailsToExport({ scope, selectedUsers, emailsText })

  const onStart = useCallback(async () => {
    const job = await API.startUsersBackupExport({ includePasswords, emails })
    onClose()
    dispatch(JobActions.showJobMonitor({ job, closeButton: BackupDownloadButton }))
  }, [dispatch, emails, includePasswords, onClose])

  return (
    <Modal className="users-backup-modal" title="usersView:usersBackup.backupTitle" onClose={onClose} showCloseButton>
      <ModalBody>
        <p>{i18n.t('usersView:usersBackup.backupInfo')}</p>
        <RadioButtonGroup
          className="users-backup-modal__scope"
          items={[
            { key: ExportScope.all, label: 'usersView:usersBackup.exportScope.all' },
            {
              key: ExportScope.selected,
              label: 'usersView:usersBackup.exportScope.selected',
              labelParams: { count: selectedUsers.length },
              disabled: selectedUsers.length === 0,
            },
            { key: ExportScope.emails, label: 'usersView:usersBackup.exportScope.emails' },
          ]}
          onChange={(value: string) => setScope(value as ExportScopeType)}
          value={scope}
        />
        {scope === ExportScope.emails && (
          <Input
            className="users-backup-modal__emails"
            inputType="textarea"
            onChange={setEmailsText}
            placeholder="usersView:usersBackup.exportScope.emailsPlaceholder"
            textAreaRows={5}
            value={emailsText}
          />
        )}
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
        <Button
          className="modal-footer__item"
          disabled={emails?.length === 0}
          label="usersView:usersBackup.backup"
          onClick={onStart}
          primary
        />
      </ModalFooter>
    </Modal>
  )
}

const ImportSummaryView = ({ summary }: { summary: ImportSummary }) => {
  const i18n = useI18n()
  const { surveysNotFound, userGroupsNotFound } = summary
  return (
    <div className="users-backup-modal__summary">
      <strong>{i18n.t('usersView:usersBackup.summaryImported')}</strong>
      <ul>
        {['usersTotal', 'usersInserted', 'usersUpdated', 'usersSkipped', 'authGroupsAdded', 'userGroupsAdded'].map(
          (key) => (
            <li key={key}>{i18n.t(`usersView:usersBackup.summary.${key}`, { count: summary[key] })}</li>
          )
        )}
      </ul>
      {surveysNotFound.length > 0 && (
        <p>
          {i18n.t('usersView:usersBackup.surveysNotFound', {
            names: surveysNotFound.join(', '),
            interpolation: { escapeValue: false },
          })}
        </p>
      )}
      {userGroupsNotFound.length > 0 && (
        <p>
          {i18n.t('usersView:usersBackup.userGroupsNotFound', {
            names: userGroupsNotFound.join(', '),
            interpolation: { escapeValue: false },
          })}
        </p>
      )}
    </div>
  )
}

const UsersBackupImportFileModal = ({
  onClose,
  onPreviewRead,
}: {
  onClose: () => void
  onPreviewRead: (preview: ImportPreview) => void
}) => {
  const i18n = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [reading, setReading] = useState(false)

  const onFilesDrop = useCallback((files: File[]) => setFile(files[0] ?? null), [])

  const onRestoreClick = useCallback(async () => {
    setReading(true)
    try {
      onPreviewRead(await API.readUsersBackupImportPreview({ file }))
    } finally {
      setReading(false)
    }
  }, [file, onPreviewRead])

  return (
    <Modal className="users-backup-modal" title="usersView:usersBackup.restoreTitle" onClose={onClose} showCloseButton>
      <ModalBody>
        <Markdown className="users-backup-modal__info" source={i18n.t('usersView:usersBackup.restoreInfo')} />
        <Dropzone accept={acceptedFiles} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} />
      </ModalBody>
      <ModalFooter>
        <Button
          className="modal-footer__item"
          disabled={!file || reading}
          label="usersView:usersBackup.restore"
          onClick={onRestoreClick}
          primary
        />
      </ModalFooter>
    </Modal>
  )
}

const UsersBackupImportUsersModal = ({
  onClose,
  onRestored,
  preview,
}: {
  onClose: () => void
  onRestored?: () => void
  preview: ImportPreview
}) => {
  const dispatch = useAppDispatch()
  const i18n = useI18n()
  const { tempFileName, info, users } = preview
  const [actionsByEmail, setActionsByEmail] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((user) => [user.email, defaultUserAction(user)]))
  )
  // by default the backup password is restored only for new users
  const [restorePasswordByEmail, setRestorePasswordByEmail] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(users.map((user) => [user.email, user.hasPassword && !user.existing]))
  )
  const [started, setStarted] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const newUsers = useMemo(() => users.filter((user) => !user.existing), [users])
  const existingUsers = useMemo(() => users.filter((user) => user.existing), [users])

  // action selected for all the specified users (null if they have different actions)
  const getCommonAction = (usersToCheck: ImportPreviewUser[]) => {
    const actions = new Set(usersToCheck.map((user) => actionsByEmail[user.email]))
    return actions.size === 1 ? [...actions][0] : null
  }

  const setActionForUsers = useCallback(
    (usersToUpdate: ImportPreviewUser[]) => (action: string) =>
      setActionsByEmail((prev) => ({
        ...prev,
        ...Object.fromEntries(usersToUpdate.map((user) => [user.email, action])),
      })),
    []
  )

  const setRestorePasswordForUsers = useCallback(
    (usersToUpdate: ImportPreviewUser[]) => (value: boolean) =>
      setRestorePasswordByEmail((prev) => ({
        ...prev,
        ...Object.fromEntries(usersToUpdate.map((user) => [user.email, value])),
      })),
    []
  )

  const onCancel = useCallback(async () => {
    if (!started) {
      // the uploaded backup contains password hashes: delete it
      await API.cancelUsersBackupImport({ tempFileName })
    }
    onClose()
    if (summary) {
      onRestored?.()
    }
  }, [onClose, onRestored, started, summary, tempFileName])

  const onConfirm = useCallback(async () => {
    setStarted(true)
    const restorePasswordEmails = users
      .filter((user) => restorePasswordByEmail[user.email] && isPasswordRestorable(user, actionsByEmail[user.email]))
      .map((user) => user.email)
    const job = await API.startUsersBackupImport({ tempFileName, actionsByEmail, restorePasswordEmails })
    dispatch(
      JobActions.showJobMonitor({
        job,
        autoHide: true,
        onComplete: (jobCompleted: any) => setSummary(jobCompleted.result?.summary ?? null),
      })
    )
  }, [actionsByEmail, dispatch, restorePasswordByEmail, tempFileName, users])

  return (
    <Modal
      className="users-backup-modal users-backup-import-users-modal"
      title="usersView:usersBackup.restoreTitle"
      onClose={onCancel}
      showCloseButton
    >
      <ModalBody>
        <p>
          {i18n.t('usersView:usersBackup.backupFileInfo', {
            serverUrl: info.serverUrl ?? '-',
            date: DateUtils.formatDateTimeDisplay(new Date(info.dateExported)),
            email: info.exportedByUserEmail,
            interpolation: { escapeValue: false },
          })}
        </p>
        {!info.includePasswords && (
          <p className="users-backup-modal__warning">{i18n.t('usersView:usersBackup.passwordsNotIncluded')}</p>
        )}
        {summary ? (
          <ImportSummaryView summary={summary} />
        ) : (
          <>
            <div className="users-backup-import-users-modal__bulk-actions">
              {newUsers.length > 0 && (
                <>
                  <span>{i18n.t('usersView:usersBackup.allNewUsers', { count: newUsers.length })}</span>
                  <UserActionButtonGroup
                    actions={newUserActions}
                    onChange={setActionForUsers(newUsers)}
                    selectedAction={getCommonAction(newUsers)}
                  />
                </>
              )}
              {existingUsers.length > 0 && (
                <>
                  <span>{i18n.t('usersView:usersBackup.allExistingUsers', { count: existingUsers.length })}</span>
                  <UserActionButtonGroup
                    actions={existingUserActions}
                    onChange={setActionForUsers(existingUsers)}
                    selectedAction={getCommonAction(existingUsers)}
                  />
                </>
              )}
            </div>
            <UsersBackupImportUsersTable
              users={users}
              actionsByEmail={actionsByEmail}
              onActionChange={(user) => setActionForUsers([user])}
              restorePasswordByEmail={restorePasswordByEmail}
              onRestorePasswordChange={setRestorePasswordForUsers}
            />
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {summary ? (
          <Button className="modal-footer__item" label="common.close" onClick={onCancel} primary />
        ) : (
          <>
            <Button className="modal-footer__item" label="common.cancel" onClick={onCancel} />
            <Button
              className="modal-footer__item"
              disabled={started}
              label="usersView:usersBackup.restore"
              onClick={onConfirm}
              primary
            />
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}

export const UsersBackupButtons = ({
  onUsersRestored,
  selectedUsers = [],
}: {
  onUsersRestored?: () => void
  selectedUsers?: any[]
}) => {
  const [openModal, setOpenModal] = useState<'export' | 'importFile' | 'importUsers' | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)

  const closeModal = useCallback(() => {
    setOpenModal(null)
    setImportPreview(null)
  }, [])

  const onImportPreviewRead = useCallback((preview: ImportPreview) => {
    setImportPreview(preview)
    setOpenModal('importUsers')
  }, [])

  return (
    <>
      <ButtonMenu
        iconName="settings"
        iconSize={16}
        label="usersView:usersBackup.menu"
        items={[
          {
            key: 'users-backup',
            iconName: 'download',
            iconSize: 16,
            label: 'usersView:usersBackup.backup',
            onClick: () => setOpenModal('export'),
          },
          {
            key: 'users-restore',
            iconName: 'upload',
            iconSize: 16,
            label: 'usersView:usersBackup.restore',
            onClick: () => setOpenModal('importFile'),
          },
        ]}
        variant="outlined"
      />
      {openModal === 'export' && <UsersBackupExportModal onClose={closeModal} selectedUsers={selectedUsers} />}
      {openModal === 'importFile' && (
        <UsersBackupImportFileModal onClose={closeModal} onPreviewRead={onImportPreviewRead} />
      )}
      {openModal === 'importUsers' && importPreview && (
        <UsersBackupImportUsersModal onClose={closeModal} onRestored={onUsersRestored} preview={importPreview} />
      )}
    </>
  )
}
