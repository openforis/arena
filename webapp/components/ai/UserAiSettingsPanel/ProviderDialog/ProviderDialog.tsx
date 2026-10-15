import './ProviderDialog.scss'

import React, { useCallback } from 'react'

import { AI_PROVIDER_NAME_MAX_CHARS } from '@common/ai/providerIds'

import { ProviderMonogram } from '@webapp/components/ai/ProviderMonogram/ProviderMonogram'
import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { TestId } from '@webapp/utils/testId'

import { getProviderNameText } from '../providerNames'
import { useT } from '../useT'
import { AccountProviderFields } from './AccountProviderFields'
import { LocalProviderFields } from './LocalProviderFields'
import type { ProviderDialogContext } from './providerDialogState'
import { isLocalDraftUrlInvalid } from './providerDraft'
import { ProviderTypeStep } from './ProviderTypeStep'
import { getProviderTypeSpec, type ProviderTypeSpec, type SavedProvider } from './providerTypes'
import { type ProviderDialogApi, useProviderDialog } from './useProviderDialog'

type Props = {
  saved: SavedProvider | null
  context: ProviderDialogContext
  onClose: () => void
  onSaved: () => void
}

/**
 * Name of the provider; empty means the default name of the type, shown as the placeholder.
 * @param {object} props - Props.
 * @param {string} props.value - Typed name.
 * @param {ProviderTypeSpec} props.spec - Type of the provider.
 * @param {Function} props.onChange - Called with the new name.
 * @returns {React.ReactElement} The field.
 */
const NameField = ({
  value,
  spec,
  onChange,
}: {
  value: string
  spec: ProviderTypeSpec
  onChange: (name: string) => void
}) => {
  const t = useT()
  return (
    <FormItem label="userAiSettings:dialog.name" htmlFor={TestId.ai.providerName}>
      <Input
        id={TestId.ai.providerName}
        value={value}
        onChange={onChange}
        placeholder={t(`userAiSettings:defaultName.${spec.value}`)}
        maxLength={AI_PROVIDER_NAME_MAX_CHARS}
      />
    </FormItem>
  )
}

/**
 * Step 2: the fields of the chosen type, the Name and the save error.
 * @param {object} props - Props.
 * @param {ProviderDialogApi} props.dialog - Dialog API (each field gets only the part it shows).
 * @param {SavedProvider|null} props.saved - Saved provider (edit), null to add.
 * @param {ProviderDialogContext} props.context - Dialog context.
 * @returns {React.ReactElement} The step.
 */
const ConnectStep = ({
  dialog,
  saved,
  context,
}: {
  dialog: ProviderDialogApi
  saved: SavedProvider | null
  context: ProviderDialogContext
}) => {
  const t = useT()
  const { state, view, actions } = dialog
  const { spec } = view
  const { draft, saveError } = state
  return (
    <div className="provider-dialog__connect">
      <div className="provider-dialog__type-header">
        <ProviderMonogram type={spec.value} />
        <b>{t(`userAiSettings:types.${spec.value}`)}</b>
      </div>
      {spec.kind === 'local' ? (
        <LocalProviderFields
          baseUrl={draft.baseUrl}
          model={draft.model}
          models={view.localModels}
          test={view.test?.local ?? null}
          testing={state.testing}
          canTest={view.canTest}
          urlInvalid={isLocalDraftUrlInvalid(draft)}
          savedBaseUrl={saved?.baseUrl ?? null}
          onBaseUrlChange={actions.setBaseUrl}
          onModelChange={actions.setModel}
          onTest={actions.runTest}
        />
      ) : (
        <AccountProviderFields
          spec={spec}
          draft={draft}
          saved={saved}
          allowlist={context.allowlist}
          encryptionConfigured={context.encryptionConfigured}
          models={state.models}
          view={view}
          testing={state.testing}
          actions={actions}
        />
      )}
      <NameField value={draft.name} spec={spec} onChange={actions.setName} />
      {saveError && (
        <div
          className="provider-dialog__hint provider-dialog__hint--error"
          role="alert"
          data-testid={TestId.ai.providerSaveError}
        >
          {saveError}
        </div>
      )}
    </div>
  )
}

/**
 * Footer: Back (add, step 2), Cancel, Add provider / Save with the "test first" hint.
 * @param {object} props - Props.
 * @param {boolean} props.connecting - Step 2 is shown.
 * @param {boolean} props.editing - A saved provider is edited.
 * @param {boolean} props.canSave - "Add provider" / "Save" is enabled.
 * @param {boolean} props.busy - A test or a save is running.
 * @param {Function} props.onBack - Back to step 1.
 * @param {Function} props.onCancel - Closes the dialog.
 * @param {Function} props.onSave - Saves the provider.
 * @returns {React.ReactElement} The footer.
 */
const DialogFooter = ({
  connecting,
  editing,
  canSave,
  busy,
  onBack,
  onCancel,
  onSave,
}: {
  connecting: boolean
  editing: boolean
  canSave: boolean
  busy: boolean
  onBack: () => void
  onCancel: () => void
  onSave: () => void
}) => {
  const t = useT()
  return (
    <ModalFooter>
      {connecting && !editing && (
        <Button variant="text" label="userAiSettings:dialog.back" onClick={onBack} testId={TestId.ai.providerBack} />
      )}
      <span className="provider-dialog__spacer" />
      {connecting && !canSave && !busy && (
        <span className="provider-dialog__hint">{t('userAiSettings:dialog.testFirst')}</span>
      )}
      <Button variant="text" label="common.cancel" onClick={onCancel} />
      {connecting && (
        <Button
          variant="contained"
          label={editing ? 'userAiSettings:dialog.save' : 'userAiSettings:dialog.add'}
          onClick={onSave}
          disabled={!canSave}
          testId={TestId.ai.providerSave}
        />
      )}
    </ModalFooter>
  )
}

/**
 * Add / edit provider dialog: step 1 picks the type (add only), step 2 connects; "Add provider" / "Save" needs a
 * passing test of the current values (a name-only edit needs none). Errors stay in the dialog. With typed values a
 * click on the backdrop or Escape does not close it (Cancel and the close button do).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The dialog.
 */
export const ProviderDialog = ({ saved, context, onClose, onSaved }: Props) => {
  const t = useT()
  const dialog = useProviderDialog({ saved, context, onSaved })
  const { state, view, groups, actions } = dialog
  const onDismiss = useCallback(() => {
    if (!view.dirty) onClose()
  }, [onClose, view.dirty])
  const connecting = state.step === 'connect'
  const providerType = saved ? getProviderTypeSpec(saved.dialogType).providerType : ''
  return (
    <Modal
      className="provider-dialog modal--centered"
      title={saved ? 'userAiSettings:dialog.editTitle' : 'userAiSettings:dialog.addTitle'}
      // the name is shown as text (React escapes it)
      titleParams={{
        name: saved ? getProviderNameText({ name: saved.name, providerType, t }) : '',
        interpolation: { escapeValue: false },
      }}
      onClose={onClose}
      onDismiss={onDismiss}
      showCloseButton
    >
      <ModalBody>
        <div className="provider-dialog__body" data-testid={TestId.ai.providerDialog}>
          {connecting ? (
            <ConnectStep dialog={dialog} saved={saved} context={context} />
          ) : (
            <ProviderTypeStep groups={groups} onChoose={actions.chooseType} />
          )}
        </div>
      </ModalBody>
      <DialogFooter
        connecting={connecting}
        editing={!!saved}
        canSave={view.canSave}
        busy={state.testing || state.saving}
        onBack={actions.back}
        onCancel={onClose}
        onSave={actions.save}
      />
    </Modal>
  )
}
