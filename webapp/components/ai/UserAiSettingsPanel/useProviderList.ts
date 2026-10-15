/**
 * State and actions of the provider list: rows from the capabilities, the add / edit dialog, and the ⋯ menu actions
 * (Make default, Test connection, Remove), which save at once and then refresh the settings and the capabilities.
 */
import { useCallback, useMemo, useState } from 'react'

import { ARENA_DEFAULT_PROVIDER_ID } from '@common/ai/providerIds'

import * as API from '@webapp/service/api'

import {
  getAiCapabilitiesSnapshot,
  getCurrentUserUuid,
  refreshAiCapabilities,
} from '@webapp/ai/engines/capabilitiesStore'
import { loadLocalProviders, saveLocalProviders } from '@webapp/ai/engines/localProviders'
import { getBrowserStorage } from '@webapp/ai/engines/localServerSettings'
import { getLocalProviderStatus } from '@webapp/ai/engines/providerEntries'
import type { AiProviderEntry } from '@webapp/ai/engines/types'
import { useAiCapabilities } from '@webapp/components/ai/hooks/useAiCapabilities'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useConfirmAsync, useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import { type AiSettings, getApiErrorMessage, type TFunction, toT } from './aiSettingsForm'
import type { ProviderDialogContext } from './ProviderDialog/providerDialogState'
import { type SavedProvider, toSavedProvider } from './ProviderDialog/providerTypes'
import {
  buildLocalProviderRemoval,
  buildProviderRows,
  getProviderDialogContext,
  getProviderDisplayName,
  isDefaultProviderMissing,
  type ProviderMenuAction,
  type ProviderRow,
} from './providerList'

export type ProviderDialogState = { saved: SavedProvider | null }

export type ProviderListApi = {
  t: TFunction
  rows: ProviderRow[]
  defaultMissing: boolean
  // the provider whose action runs (the menus are disabled meanwhile)
  busyId: string | null
  dialog: ProviderDialogState | null
  dialogContext: ProviderDialogContext
  openAdd: () => void
  closeDialog: () => void
  onDialogSaved: () => void
  runAction: (row: ProviderRow, action: ProviderMenuAction) => Promise<void>
}

type Params = {
  settings: AiSettings
  reloadSettings: () => Promise<void>
}

/**
 * Probes the local providers again and returns whether this one is ready.
 * @param {string} id - Local provider id.
 * @returns {Promise<boolean>} True when it answered and lists its model.
 */
const testLocalProvider = async (id: string): Promise<boolean> => {
  await refreshAiCapabilities()
  return getLocalProviderStatus(getAiCapabilitiesSnapshot().local[id] ?? null) === 'ready'
}

/**
 * Tests a saved account provider with its saved values (the server stamps the result, so the pill follows).
 * @param {string} id - Account provider id.
 * @returns {Promise<boolean>} True when it answered.
 */
const testAccountProvider = async (id: string): Promise<boolean> => {
  const result = await API.aiProviders.testProvider({ id })
  return !!result.ok
}

/**
 * Removes a local provider from this browser; the default goes back to Arena default when it was this provider.
 * @param {object} params - Parameters.
 * @param {string} params.id - Local provider id.
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {Promise<boolean>} False when the browser storage could not be written (nothing changed).
 */
const removeLocalProvider = async ({ id, defaultProviderId }: { id: string; defaultProviderId: string }) => {
  const storage = getBrowserStorage()
  const userUuid = getCurrentUserUuid()
  const { providers, resetDefault } = buildLocalProviderRemoval({
    providers: loadLocalProviders({ storage, userUuid }),
    id,
    defaultProviderId,
  })
  if (!saveLocalProviders({ storage, userUuid, providers })) return false
  // the server cannot see local providers: the browser resets the default itself
  if (resetDefault) await API.aiProviders.setDefaultProvider({ providerId: ARENA_DEFAULT_PROVIDER_ID })
  return true
}

/**
 * Returns the state and the actions of the provider list.
 * @param {Params} params - Loaded settings and the function that reloads them.
 * @returns {ProviderListApi} The list API.
 */
export const useProviderList = ({ settings, reloadSettings }: Params): ProviderListApi => {
  const i18n = useI18n()
  const t = useMemo(() => toT(i18n), [i18n])
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const confirm = useConfirmAsync()
  const { providers, defaultProviderId } = useAiCapabilities()
  const [dialog, setDialog] = useState<ProviderDialogState | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const rows = useMemo(() => buildProviderRows({ providers, defaultProviderId }), [defaultProviderId, providers])
  const dialogContext = useMemo(
    () => getProviderDialogContext({ settings, providers, defaultProviderId }),
    [defaultProviderId, providers, settings]
  )

  /**
   * Reads the cached settings, the capabilities and the panel's settings again, after every immediate save.
   * @returns {Promise<void>} Resolves when everything is refreshed.
   */
  const refreshAll = useCallback(async () => {
    invalidateAiSettingsCache()
    await Promise.all([refreshAiCapabilities().catch(() => undefined), reloadSettings()])
  }, [reloadSettings])

  /**
   * Makes a provider the default one and tells the user.
   * @param {AiProviderEntry} entry - The provider.
   * @returns {Promise<void>} Resolves when saved and refreshed.
   */
  const makeDefault = useCallback(
    async (entry: AiProviderEntry) => {
      await API.aiProviders.setDefaultProvider({ providerId: entry.id })
      await refreshAll()
      notifyInfo({ key: 'userAiSettings:list.defaultChanged', params: { name: getProviderDisplayName({ entry, t }) } })
    },
    [notifyInfo, refreshAll, t]
  )

  /**
   * Tests a saved provider and tells the user whether it answered.
   * @param {AiProviderEntry} entry - The provider.
   * @returns {Promise<void>} Resolves when tested and refreshed.
   */
  const testConnection = useCallback(
    async (entry: AiProviderEntry) => {
      const ok = entry.kind === 'local' ? await testLocalProvider(entry.id) : await testAccountProvider(entry.id)
      if (entry.kind !== 'local') await refreshAll()
      const params = { name: getProviderDisplayName({ entry, t }) }
      if (ok) notifyInfo({ key: 'userAiSettings:list.testOk', params })
      else notifyError({ key: 'userAiSettings:list.testFailed', params })
    },
    [notifyError, notifyInfo, refreshAll, t]
  )

  /**
   * Removes a provider after the user confirms.
   * @param {AiProviderEntry} entry - The provider.
   * @returns {Promise<void>} Resolves when removed and refreshed.
   */
  const remove = useCallback(
    async (entry: AiProviderEntry) => {
      const name = getProviderDisplayName({ entry, t })
      if (!(await confirm({ key: 'userAiSettings:list.removeConfirm', params: { name } }))) return
      let removed = false
      try {
        if (entry.kind === 'local') {
          if (!(await removeLocalProvider({ id: entry.id, defaultProviderId }))) {
            notifyError({ key: 'userAiSettings:localServer.notSaved' })
            return
          }
        } else {
          // the server resets the default when it was this provider
          await API.aiProviders.removeProvider(entry.id)
        }
        removed = true
      } finally {
        // also when resetting the default failed after the local provider was removed: the list must not go stale
        await refreshAll()
      }
      if (removed) notifyInfo({ key: 'userAiSettings:list.removed', params: { name } })
    },
    [confirm, defaultProviderId, notifyError, notifyInfo, refreshAll, t]
  )

  /**
   * Opens the dialog on a saved provider.
   * @param {AiProviderEntry} entry - The provider.
   * @returns {void} Nothing.
   */
  const openEdit = useCallback(
    (entry: AiProviderEntry) => {
      const saved = toSavedProvider({
        entry,
        accountProviders: settings.providers ?? [],
        allowlist: dialogContext.allowlist,
      })
      if (saved) setDialog({ saved })
    },
    [dialogContext.allowlist, settings.providers]
  )

  /**
   * Runs a menu action of a row; a failure is shown to the user.
   * @param {ProviderRow} row - The row.
   * @param {ProviderMenuAction} action - The action.
   * @returns {Promise<void>} Resolves when the action ended.
   */
  const runAction = useCallback(
    async (row: ProviderRow, action: ProviderMenuAction) => {
      const { entry } = row
      if (action === 'edit') {
        openEdit(entry)
        return
      }
      const actions = { makeDefault, test: testConnection, remove }
      setBusyId(entry.id)
      try {
        await actions[action](entry)
      } catch (error) {
        notifyError({ key: 'userAiSettings:list.actionFailed', params: { message: getApiErrorMessage({ error, t }) } })
      } finally {
        setBusyId(null)
      }
    },
    [makeDefault, notifyError, openEdit, remove, t, testConnection]
  )

  /**
   * Opens the dialog on a new provider.
   * @returns {void} Nothing.
   */
  const openAdd = useCallback(() => setDialog({ saved: null }), [])
  /**
   * Closes the dialog.
   * @returns {void} Nothing.
   */
  const closeDialog = useCallback(() => setDialog(null), [])
  /**
   * Closes the dialog after a save. The dialog already refreshed the cache and the capabilities; the key flags come
   * with the settings.
   * @returns {void} Nothing.
   */
  const onDialogSaved = useCallback(() => {
    setDialog(null)
    reloadSettings()
  }, [reloadSettings])

  return {
    t,
    rows,
    defaultMissing: isDefaultProviderMissing({ providers, defaultProviderId }),
    busyId,
    dialog,
    dialogContext,
    openAdd,
    closeDialog,
    onDialogSaved,
    runAction,
  }
}
