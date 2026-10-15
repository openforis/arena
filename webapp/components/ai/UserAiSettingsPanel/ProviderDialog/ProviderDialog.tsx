import './ProviderDialog.scss'

import React from 'react'

import { AI_PROVIDER_NAME_MAX_CHARS } from '@common/ai/providerIds'

import { ProviderMonogram } from '@webapp/components/ai/ProviderMonogram/ProviderMonogram'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Modal as ModalJS, ModalBody as ModalBodyJS, ModalFooter as ModalFooterJS } from '@webapp/components/modal'
import { TestId } from '@webapp/utils/testId'

import { AccountProviderFields } from './AccountProviderFields'
import { LocalProviderFields } from './LocalProviderFields'
import { getDefaultNameOf, type SavedProvider } from './providerDraft'
import { ProviderTypeStep } from './ProviderTypeStep'
import { type ProviderDialogApi, type ProviderDialogContext, useProviderDialog } from './useProviderDialog'

// JS components lose their prop types in TS (same cast as the panel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>
const Modal = ModalJS as React.ComponentType<any>
const ModalBody = ModalBodyJS as React.ComponentType<any>
const ModalFooter = ModalFooterJS as React.ComponentType<any>

type Props = {
  saved: SavedProvider | null
  context: ProviderDialogContext
  onClose: () => void
  onSaved: () => void
}

/**
 * Step 2: the fields of the chosen type, the Name and the save error.
 * @param {object} props - Props.
 * @param {ProviderDialogApi} props.dialog - Dialog API.
 * @returns {React.ReactElement} The step.
 */
const ConnectStep = ({ dialog }: { dialog: ProviderDialogApi }) => {
  const { t, spec, draft } = dialog
  return (
    <div className="provider-dialog__connect">
      <div className="provider-dialog__type-header">
        <ProviderMonogram type={spec.value} />
        <b>{t(`userAiSettings:types.${spec.value}`)}</b>
      </div>
      {spec.kind === 'local' ? <LocalProviderFields dialog={dialog} /> : <AccountProviderFields dialog={dialog} />}
      <FormItem label="userAiSettings:dialog.name" htmlFor={TestId.ai.providerName}>
        <Input
          id={TestId.ai.providerName}
          value={draft.name}
          onChange={dialog.setName}
          placeholder={getDefaultNameOf(spec)}
          maxLength={AI_PROVIDER_NAME_MAX_CHARS}
        />
      </FormItem>
      {dialog.saveError && (
        <div
          className="provider-dialog__hint provider-dialog__hint--error"
          role="alert"
          data-testid={TestId.ai.providerSaveError}
        >
          {dialog.saveError}
        </div>
      )}
    </div>
  )
}

/**
 * Footer: Back (add, step 2), Cancel, Add provider / Save with the "test first" hint.
 * @param {object} props - Props.
 * @param {ProviderDialogApi} props.dialog - Dialog API.
 * @param {Function} props.onClose - Closes the dialog.
 * @returns {React.ReactElement} The footer.
 */
const DialogFooter = ({ dialog, onClose }: { dialog: ProviderDialogApi; onClose: () => void }) => {
  const connecting = dialog.step === 'connect'
  return (
    <ModalFooter>
      {connecting && !dialog.editing && (
        <Button
          variant="text"
          label="userAiSettings:dialog.back"
          onClick={dialog.back}
          testId={TestId.ai.providerBack}
        />
      )}
      <span className="provider-dialog__spacer" />
      {connecting && !dialog.canSave && !dialog.saving && (
        <span className="provider-dialog__hint">{dialog.t('userAiSettings:dialog.testFirst')}</span>
      )}
      <Button variant="text" label="common.cancel" onClick={onClose} />
      {connecting && (
        <Button
          variant="contained"
          label={dialog.editing ? 'userAiSettings:dialog.save' : 'userAiSettings:dialog.add'}
          onClick={dialog.save}
          disabled={!dialog.canSave}
          testId={TestId.ai.providerSave}
        />
      )}
    </ModalFooter>
  )
}

/**
 * Add / edit provider dialog (spec 4.1): step 1 picks the type (add only), step 2 connects; "Add provider" / "Save"
 * needs a passing test of the current values (a name-only edit needs none). Errors stay in the dialog.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The dialog.
 */
export const ProviderDialog = ({ saved, context, onClose, onSaved }: Props) => {
  const dialog = useProviderDialog({ saved, context, onSaved })
  return (
    <Modal
      className="provider-dialog"
      title={saved ? 'userAiSettings:dialog.editTitle' : 'userAiSettings:dialog.addTitle'}
      // the name is shown as text (React escapes it)
      titleParams={{ name: saved?.name ?? '', interpolation: { escapeValue: false } }}
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <div className="provider-dialog__body" data-testid={TestId.ai.providerDialog}>
          {dialog.step === 'type' ? (
            <ProviderTypeStep groups={dialog.groups} onChoose={dialog.chooseType} t={dialog.t} />
          ) : (
            <ConnectStep dialog={dialog} />
          )}
        </div>
      </ModalBody>
      <DialogFooter dialog={dialog} onClose={onClose} />
    </Modal>
  )
}
