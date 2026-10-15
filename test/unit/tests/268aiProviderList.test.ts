import type { AiProviderEntry } from '@webapp/ai/engines/types'
import {
  buildLocalProviderRemoval,
  buildProviderRows,
  getProviderDialogContext,
  getProviderDisplayName,
  getProviderMenuActions,
  getProviderStatusPill,
  getProviderWhereKey,
  isDefaultProviderMissing,
} from '@webapp/components/ai/UserAiSettingsPanel/providerList'
import { fakeT as t } from '../utils/fakeT'

const account: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'anthropic',
  name: 'Claude',
  model: 'claude-x',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}

const org: AiProviderEntry = {
  ...account,
  id: 'acct:o1',
  type: 'openai-compatible',
  name: 'GPU',
  baseUrl: 'http://gpu.org.example:8000/v1',
  hostingClass: 'orgHosted',
  status: 'notTested',
}

const local: AiProviderEntry = {
  id: 'local:l1',
  kind: 'local',
  type: 'local',
  name: 'Local server',
  model: 'gemma',
  baseUrl: 'http://localhost:1234/v1',
  hostingClass: 'onDevice',
  status: 'notAvailable',
}

const arena: AiProviderEntry = {
  id: 'arena-default',
  kind: 'arenaDefault',
  type: 'openai',
  name: 'Arena default',
  model: 'gpt-x',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}

const arenaNotSetUp: AiProviderEntry = {
  ...arena,
  type: 'arena-default',
  model: null,
  hostingClass: null,
  status: 'notSetUp',
}

describe('provider list (268)', () => {
  test('where tag: this computer, organisation server, cloud with your key, cloud', () => {
    expect(getProviderWhereKey(local)).toBe('onDevice')
    expect(getProviderWhereKey(org)).toBe('orgHosted')
    expect(getProviderWhereKey(account)).toBe('cloudOwnKey')
    expect(getProviderWhereKey(arena)).toBe('cloud')
    // a local server outside this device and the allowlist is cloud, but holds no key of the user
    expect(getProviderWhereKey({ ...local, hostingClass: 'cloud' })).toBe('cloud')
    expect(getProviderWhereKey(arenaNotSetUp)).toBeNull()
  })

  test('status pill: a tone and a text for each status', () => {
    expect(getProviderStatusPill('ready')).toEqual({ tone: 'ok', key: 'userAiSettings:status.ready' })
    expect(getProviderStatusPill('notTested')).toEqual({ tone: 'warn', key: 'userAiSettings:status.notTested' })
    expect(getProviderStatusPill('notAvailable')).toEqual({ tone: 'bad', key: 'userAiSettings:status.notAvailable' })
    expect(getProviderStatusPill('notSetUp')).toEqual({ tone: 'warn', key: 'userAiSettings:status.notSetUp' })
  })

  test('menu: Arena default has only Make default; the default has no Make default', () => {
    expect(getProviderMenuActions({ entry: account, isDefault: false })).toEqual([
      'makeDefault',
      'test',
      'edit',
      'remove',
    ])
    expect(getProviderMenuActions({ entry: local, isDefault: true })).toEqual(['test', 'edit', 'remove'])
    expect(getProviderMenuActions({ entry: arena, isDefault: false })).toEqual(['makeDefault'])
    expect(getProviderMenuActions({ entry: arena, isDefault: true })).toEqual([])
  })

  test('rows keep the order, mark one default and use the Arena mark for Arena default', () => {
    const rows = buildProviderRows({ providers: [account, local, arena], defaultProviderId: 'local:l1' })
    expect(rows.map((row) => [row.entry.id, row.isDefault, row.monogramType])).toEqual([
      ['acct:a1', false, 'anthropic'],
      ['local:l1', true, 'local'],
      ['arena-default', false, 'arena-default'],
    ])
    expect(rows[1].pill).toEqual({ tone: 'bad', key: 'userAiSettings:status.notAvailable' })
    expect(rows[2].actions).toEqual(['makeDefault'])
    expect(getProviderDisplayName({ entry: arena, t })).toBe('userAiSettings:list.arenaDefault')
    expect(getProviderDisplayName({ entry: account, t })).toBe('Claude')
  })

  test('a local default saved in another browser has no row: the list says so', () => {
    expect(isDefaultProviderMissing({ providers: [account, arena], defaultProviderId: 'local:elsewhere' })).toBe(true)
    expect(isDefaultProviderMissing({ providers: [account, arena], defaultProviderId: 'acct:a1' })).toBe(false)
    // before the capabilities are loaded there is nothing to compare with
    expect(isDefaultProviderMissing({ providers: [], defaultProviderId: 'local:elsewhere' })).toBe(false)
  })

  test('dialog context: allowlist, encryption and mock from the settings; Arena default ready from its row', () => {
    const settings = {
      orgHostedBaseUrls: ['http://gpu.org.example:8000/v1'],
      encryptionConfigured: true,
      mockProviderEnabled: true,
    }
    expect(getProviderDialogContext({ settings, providers: [account, arena], defaultProviderId: 'acct:a1' })).toEqual({
      allowlist: ['http://gpu.org.example:8000/v1'],
      encryptionConfigured: true,
      mockEnabled: true,
      defaultProviderId: 'acct:a1',
      arenaDefaultReady: true,
    })
    expect(
      getProviderDialogContext({ settings: {}, providers: [arenaNotSetUp], defaultProviderId: 'arena-default' })
    ).toEqual({
      allowlist: [],
      encryptionConfigured: false,
      mockEnabled: false,
      defaultProviderId: 'arena-default',
      arenaDefaultReady: false,
    })
  })

  test('removing a local provider keeps the others; the default goes back to Arena default only when it was this one', () => {
    const stored = [
      { id: 'local:l1', name: 'A', baseUrl: 'http://localhost:1/v1', modelId: 'x' },
      { id: 'local:l2', name: 'B', baseUrl: 'http://localhost:2/v1', modelId: null },
    ]
    expect(buildLocalProviderRemoval({ providers: stored, id: 'local:l1', defaultProviderId: 'local:l1' })).toEqual({
      providers: [stored[1]],
      resetDefault: true,
    })
    expect(buildLocalProviderRemoval({ providers: stored, id: 'local:l2', defaultProviderId: 'acct:a1' })).toEqual({
      providers: [stored[0]],
      resetDefault: false,
    })
  })
})
