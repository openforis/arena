import { ButtonSave } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

type Props = {
  canSave: boolean
  onSave: () => void
}

/**
 * Bar sticking to the bottom of the user edit page while there are unsaved changes.
 */
export const UserEditSaveBar = (props: Props) => {
  const { canSave, onSave } = props
  const i18n = useI18n()
  return (
    <output className="user-edit-save-bar">
      <span aria-hidden="true" className="user-edit-save-bar__dot" />
      <span className="user-edit-save-bar__text">{i18n.t('usersView:profile.unsavedChanges')}</span>
      <ButtonSave className="btn-save" disabled={!canSave} onClick={onSave} />
    </output>
  )
}
