import React from 'react'
import classNames from 'classnames'

import { ProviderMonogram } from '@webapp/components/ai/ProviderMonogram/ProviderMonogram'
import { Button as ButtonJS, ButtonMenu } from '@webapp/components/buttons'
import { Fieldset } from '@webapp/components/Fieldset'
import { TestId } from '@webapp/utils/testId'

import type { AiSettings } from './aiSettingsForm'
import { ProviderDialog } from './ProviderDialog/ProviderDialog'
import { getProviderDisplayName, type ProviderMenuAction, type ProviderRow } from './providerList'
import { StatusPill } from './StatusPill'
import { type ProviderListApi, useProviderList } from './useProviderList'

// forwardRef components lose their prop types in TS (same cast as the dialog)
const Button = ButtonJS as React.ComponentType<any>

const MENU_LABELS: Record<ProviderMenuAction, string> = {
  makeDefault: 'userAiSettings:list.makeDefault',
  test: 'userAiSettings:list.test',
  edit: 'userAiSettings:list.edit',
  remove: 'userAiSettings:list.remove',
}

type RowProps = {
  row: ProviderRow
  list: ProviderListApi
}

/**
 * ⋯ menu of a row (an empty cell keeps the columns aligned when there is no action).
 * @param {RowProps} props - Props.
 * @returns {React.ReactElement} The menu.
 */
const RowMenu = ({ row, list }: RowProps) => {
  const { entry, actions } = row
  if (actions.length === 0) return <span className="user-ai-settings-panel__provider-menu" aria-hidden="true" />
  return (
    <ButtonMenu
      className="user-ai-settings-panel__provider-menu"
      icon={<span aria-hidden="true">⋯</span>}
      // the title is the accessible name of the icon button
      title="userAiSettings:list.menu"
      titleParams={{ name: getProviderDisplayName({ entry, t: list.t }) }}
      showCaret={false}
      variant="text"
      disabled={list.busyId !== null}
      testId={TestId.ai.providerMenu(entry.id)}
      items={actions.map((action) => ({
        key: action,
        label: MENU_LABELS[action],
        testId: TestId.ai.providerMenuItem(action),
        onClick: () => {
          list.runAction(row, action)
        },
      }))}
    />
  )
}

/**
 * One provider: monogram, name, model and where tag, Default marker, status pill and ⋯ menu.
 * @param {RowProps} props - Props.
 * @returns {React.ReactElement} The row.
 */
const ProviderRowView = ({ row, list }: RowProps) => {
  const { t } = list
  const { entry, isDefault, whereKey, pill } = row
  return (
    <li
      className={classNames('user-ai-settings-panel__provider', {
        'user-ai-settings-panel__provider--default': isDefault,
      })}
      data-testid={TestId.ai.providerRow(entry.id)}
    >
      <ProviderMonogram type={row.monogramType} />
      <span className="user-ai-settings-panel__provider-text">
        <span className="user-ai-settings-panel__provider-name">{getProviderDisplayName({ entry, t })}</span>
        <span className="user-ai-settings-panel__provider-meta">
          {entry.model && <span className="user-ai-settings-panel__provider-model">{entry.model}</span>}
          {whereKey && <span className="user-ai-settings-panel__where">{t(`userAiSettings:where.${whereKey}`)}</span>}
        </span>
      </span>
      <span className="user-ai-settings-panel__provider-tags">
        {isDefault && (
          <span className="user-ai-settings-panel__default" data-testid={TestId.ai.providerDefault}>
            {t('userAiSettings:list.default')}
          </span>
        )}
        <StatusPill tone={pill.tone} text={t(pill.key)} />
        <RowMenu row={row} list={list} />
      </span>
    </li>
  )
}

type Props = {
  settings: AiSettings
  reloadSettings: () => Promise<void>
}

/**
 * Providers block of the panel (spec section 4): "Add provider", one row per provider (Arena default last), the
 * footer hint, and the add / edit dialog.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The block.
 */
export const ProviderList = ({ settings, reloadSettings }: Props) => {
  const list = useProviderList({ settings, reloadSettings })
  const { t } = list
  return (
    <Fieldset className="user-ai-settings-panel__section" legend="userAiSettings:list.section">
      <div className="user-ai-settings-panel__providers-header">
        <Button
          variant="outlined"
          iconClassName="icon-plus icon-12px"
          label="userAiSettings:list.add"
          onClick={list.openAdd}
          testId={TestId.ai.providersAdd}
        />
      </div>
      {list.defaultMissing && (
        <div
          className="user-ai-settings-panel__hint user-ai-settings-panel__hint--warning"
          data-testid={TestId.ai.providerDefaultMissing}
        >
          {t('userAiSettings:list.defaultMissing')}
        </div>
      )}
      <ul className="user-ai-settings-panel__providers">
        {list.rows.map((row) => (
          <ProviderRowView key={row.entry.id} row={row} list={list} />
        ))}
      </ul>
      <div className="user-ai-settings-panel__footer-hint">{t('userAiSettings:list.footerHint')}</div>
      {list.dialog && (
        <ProviderDialog
          saved={list.dialog.saved}
          context={list.dialogContext}
          onClose={list.closeDialog}
          onSaved={list.onDialogSaved}
        />
      )}
    </Fieldset>
  )
}
