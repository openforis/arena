import './DialogConfirm.scss'

import React from 'react'
import classNames from 'classnames'

import { Button, ButtonCancel } from '@webapp/components'
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
    headerText,
    strongConfirm,
    strongConfirmInputLabel,
    strongConfirmRequiredText,
    strongConfirmText,
    isDismissable,
    onStrongConfirmInputChange,
    onClose,
    onOk,
  } = useDialogConfirm()

  return key ? (
    <Modal className="dialog-confirm" onClose={onClose} title={headerText}>
      <ModalBody>
        <Markdown className={headerText ? 'highlight' : undefined} source={i18n.t(key, params)} />

        {strongConfirm && (
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
          className={classNames('btn-primary modal-footer__item', okButtonClass)}
          iconClassName={okButtonIconClass}
          onClick={onOk}
          disabled={strongConfirm && strongConfirmRequiredText !== strongConfirmText}
          label={okButtonLabel}
        />
      </ModalFooter>
    </Modal>
  ) : null
}

export default DialogConfirm
