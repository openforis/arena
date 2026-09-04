import './DialogConfirm.scss'

import classNames from 'classnames'

import { Button, ButtonCancel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import Markdown from '@webapp/components/markdown'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import { useI18n } from '@webapp/store/system'
import { useDialogConfirm } from '@webapp/store/ui'

import { TestId } from '@webapp/utils/testId'

const DialogConfirm = () => {
  const i18n = useI18n()
  const {
    key,
    params,
    okButtonLabel,
    okButtonClass,
    okButtonIconClass,
    checkboxLabel,
    checkboxChecked,
    okButtonLabelChecked,
    okButtonClassChecked,
    headerText,
    strongConfirm,
    strongConfirmInputLabel,
    strongConfirmRequiredText,
    strongConfirmText,
    dismissable: isDismissable,
    onStrongConfirmInputChange,
    onClose,
    onOk,
    onCheckboxChange,
  } = useDialogConfirm()

  if (!key) {
    return null
  }

  // The checkbox (unchecked by default) offers a secondary, opt-in action; while it's checked, it
  // swaps in okButtonLabelChecked/okButtonClassChecked for the OK button and, if strong confirmation
  // was requested, is the only time it's actually enforced - unchecked, the (default) action just
  // needs a plain confirm.
  const strongConfirmActive = strongConfirm && (!checkboxLabel || checkboxChecked)

  return (
    <Modal className="dialog-confirm" onClose={onClose} title={headerText}>
      <ModalBody>
        <Markdown className={headerText ? 'highlight' : undefined} source={i18n.t(key, params)} />

        {checkboxLabel && (
          <Checkbox
            checked={checkboxChecked}
            label={checkboxLabel}
            onChange={onCheckboxChange}
            testId={TestId.dialogConfirm.checkbox}
          />
        )}

        {strongConfirmActive && (
          <>
            <Markdown className="text-center" source={i18n.t(strongConfirmInputLabel, { strongConfirmRequiredText })} />

            <input
              type="text"
              className="dialog-confirm__input-text"
              value={strongConfirmText}
              data-testid={TestId.dialogConfirm.strongConfirmInput}
              onChange={onStrongConfirmInputChange}
            />
          </>
        )}
      </ModalBody>

      <ModalFooter>
        {isDismissable && <ButtonCancel className="btn-secondary btn-cancel modal-footer-item" onClick={onClose} />}

        <Button
          className={classNames(
            'btn-primary modal-footer__item',
            checkboxChecked ? (okButtonClassChecked ?? okButtonClass) : okButtonClass
          )}
          iconClassName={okButtonIconClass}
          onClick={onOk}
          disabled={strongConfirmActive && strongConfirmRequiredText !== strongConfirmText}
          label={checkboxChecked && okButtonLabelChecked ? okButtonLabelChecked : okButtonLabel}
        />
      </ModalFooter>
    </Modal>
  )
}

export default DialogConfirm
