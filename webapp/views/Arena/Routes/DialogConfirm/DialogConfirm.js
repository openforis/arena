import './DialogConfirm.scss'

import React from 'react'
import classNames from 'classnames'
import { useDispatch } from 'react-redux'

import { Button, ButtonCancel } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, useDialogConfirm } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

const DialogConfirm = () => {
  const dispatch = useDispatch()
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
  } = useDialogConfirm()

  return key ? (
    <Modal
      className="dialog-confirm"
      onClose={() => dispatch(DialogConfirmActions.onDialogConfirmCancel())}
      title={headerText}
    >
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
              onChange={(event) => dispatch(DialogConfirmActions.onDialogConfirmTextChange(event.target.value))}
            />
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <ButtonCancel
          className="btn-secondary btn-cancel modal-footer-item"
          iconClassName="icon-cross icon-12px"
          onClick={() => dispatch(DialogConfirmActions.onDialogConfirmCancel())}
        />

        <Button
          className={classNames('btn-primary modal-footer__item', okButtonClass)}
          iconClassName={okButtonIconClass}
          onClick={() => dispatch(DialogConfirmActions.onDialogConfirmOk())}
          disabled={strongConfirm && strongConfirmRequiredText !== strongConfirmText}
          label={okButtonLabel}
        />
      </ModalFooter>
    </Modal>
  ) : null
}

export default DialogConfirm
