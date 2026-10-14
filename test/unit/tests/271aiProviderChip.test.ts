import type { AiPolicy } from '@common/ai/policy'
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

import { isProviderChoiceError } from '@webapp/ai/engines/engineUi'
import type { AiCapabilities, AiProviderEntry } from '@webapp/ai/engines/types'
import {
  buildProviderChoices,
  getConversationProvider,
  getProviderChipLabel,
  getProviderChipView,
  shouldShowProviderRemoved,
} from '@webapp/components/ai/Assistant/providerChip/providerChipModel'

const ACCOUNT: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'My OpenAI',
  model: 'gpt-x',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}
const LOCAL: AiProviderEntry = {
  id: 'local:l1',
  kind: 'local',
  type: 'local',
  name: 'Desk server',
  model: 'local-model',
  baseUrl: 'http://localhost:1234/v1',
  hostingClass: 'onDevice',
  status: 'ready',
}
const ARENA: AiProviderEntry = {
  id: 'arena-default',
  kind: 'arenaDefault',
  type: 'openai',
  name: 'Arena default',
  model: 'admin-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}
const ARENA_NOT_SET_UP: AiProviderEntry = {
  ...ARENA,
  type: 'arena-default',
  model: null,
  hostingClass: null,
  status: 'notSetUp',
}

const CLOUD: AiPolicy = { schema: 'cloud', data: 'cloud' }
const KEEP_DATA_ON_DEVICE: AiPolicy = { schema: 'cloud', data: 'onDevice' }

/** Builds capabilities with the given provider list and default. */
const capabilities = ({
  providers = [ACCOUNT, LOCAL, ARENA],
  defaultProviderId = 'acct:a1',
}: { providers?: AiProviderEntry[]; defaultProviderId?: string } = {}): AiCapabilities => ({
  localServer: {
    enabled: false,
    reachable: null,
    models: [],
    hostingClass: null,
    contextTokens: null,
    baseUrl: null,
    modelId: null,
    error: null,
  },
  gateway: { available: false, hostingClass: null, provider: null, model: null, maxPromptChars: 200000 },
  instance: { policyCeilings: CLOUD, orgHostedBaseUrls: [] },
  providers,
  defaultProviderId,
  local: {},
})

/** Test translation function: prefixes the key. */
const t = (key: string) => `t:${key}`

/** Summarizes each row as [id, disabled, reason, selected, default]. */
const summarize = (choices: ReturnType<typeof buildProviderChoices>) =>
  choices.map((choice) => [choice.entry.id, choice.disabled, choice.reasonKey, choice.selected, choice.isDefault])

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

describe('provider chip (271)', () => {
  test('a removed provider falls back to the default with a notice', () => {
    expect(getConversationProvider({ capabilities: capabilities(), providerId: 'acct:gone' })).toEqual({
      providerId: 'acct:a1',
      entry: ACCOUNT,
      removed: true,
    })
    expect(getConversationProvider({ capabilities: capabilities(), providerId: 'local:l1' })).toEqual({
      providerId: 'local:l1',
      entry: LOCAL,
      removed: false,
    })
    expect(getConversationProvider({ capabilities: capabilities() }).removed).toBe(false)
  })

  test('the removed notice waits for the capabilities of the user to load', () => {
    const params = { capabilities: capabilities(), providerId: 'acct:gone' }
    expect(shouldShowProviderRemoved({ ...params, loaded: false })).toBe(false)
    expect(shouldShowProviderRemoved({ ...params, loaded: true })).toBe(true)
    expect(shouldShowProviderRemoved({ capabilities: capabilities(), loaded: true, providerId: 'local:l1' })).toBe(
      false
    )
    expect(shouldShowProviderRemoved({ capabilities: capabilities(), loaded: true })).toBe(false)
  })

  test('rows the policy blocks are disabled with the reason; the others can be picked', () => {
    const choices = buildProviderChoices({
      capabilities: capabilities(),
      effective: KEEP_DATA_ON_DEVICE,
      dataClass: 'data',
      surveyScoped: true,
      selectedId: 'local:l1',
    })
    expect(summarize(choices)).toEqual([
      ['acct:a1', true, 'aiPolicy.blocked.data.onDevice', false, true],
      ['local:l1', false, null, true, false],
      ['arena-default', true, 'aiPolicy.blocked.data.onDevice', false, false],
    ])
    const help = buildProviderChoices({
      capabilities: capabilities(),
      effective: KEEP_DATA_ON_DEVICE,
      dataClass: 'data',
      surveyScoped: false,
      selectedId: 'acct:a1',
    })
    expect(help[0].reasonKey).toBe('aiPolicy.blockedByInstance.data')
  })

  test('Arena default without an admin default is not set up; every row waits for the policy', () => {
    const caps = capabilities({ providers: [ACCOUNT, ARENA_NOT_SET_UP] })
    const params = { capabilities: caps, dataClass: 'schema' as const, surveyScoped: true, selectedId: 'acct:a1' }
    expect(summarize(buildProviderChoices({ ...params, effective: CLOUD }))).toEqual([
      ['acct:a1', false, null, true, true],
      ['arena-default', true, 'userAiSettings:status.notSetUp', false, false],
    ])
    expect(summarize(buildProviderChoices({ ...params, effective: null }))).toEqual([
      ['acct:a1', true, null, true, true],
      ['arena-default', true, null, false, false],
    ])
  })

  test('rows show where the provider runs', () => {
    const choices = buildProviderChoices({
      capabilities: capabilities(),
      effective: CLOUD,
      dataClass: 'schema',
      surveyScoped: true,
      selectedId: 'acct:a1',
    })
    expect(choices.map((choice) => choice.whereKey)).toEqual(['cloudOwnKey', 'onDevice', 'cloud'])
  })

  test('the chip: provider name and model, a red dot when it cannot answer', () => {
    const caps = capabilities()
    const current = getConversationProvider({ capabilities: caps })
    expect(getProviderChipView({ capabilities: caps, current, status: 'available' })).toEqual({
      kind: 'provider',
      entry: ACCOUNT,
      tone: 'ok',
    })
    expect(getProviderChipView({ capabilities: caps, current, status: 'noEngine' })).toEqual({
      kind: 'provider',
      entry: ACCOUNT,
      tone: 'bad',
    })
    expect(getProviderChipLabel({ entry: ACCOUNT, t })).toBe('My OpenAI · gpt-x')
    expect(getProviderChipLabel({ entry: ARENA, t })).toBe('t:userAiSettings:list.arenaDefault · admin-model')
    expect(getProviderChipLabel({ entry: { ...LOCAL, model: null }, t })).toBe('Desk server')
  })

  test('"No provider" when nothing is set up; a default of another computer is missing', () => {
    const empty = capabilities({ providers: [ARENA_NOT_SET_UP], defaultProviderId: 'arena-default' })
    const emptyCurrent = getConversationProvider({ capabilities: empty })
    expect(getProviderChipView({ capabilities: empty, current: emptyCurrent, status: 'noEngine' })).toEqual({
      kind: 'none',
    })
    const elsewhere = capabilities({ defaultProviderId: 'local:at-home' })
    const current = getConversationProvider({ capabilities: elsewhere })
    expect(current).toEqual({ providerId: 'local:at-home', entry: null, removed: false })
    expect(getProviderChipView({ capabilities: elsewhere, current, status: 'noEngine' })).toEqual({ kind: 'missing' })
  })

  test('errors of the provider offer the switcher', () => {
    for (const key of [
      'aiNoEngineAvailable',
      'aiLocalServerUnreachable',
      'aiLocalServerModelMissing',
      'aiProviderChooseAnother',
      'aiProviderNotFound',
      'aiApiKeyUnreadable',
      'aiProviderAuth',
      'aiProviderUnavailable',
    ]) {
      expect([key, isProviderChoiceError(key)]).toEqual([key, true])
    }
    for (const key of ['aiLocalServerContextExceeded', 'aiTranslationInvalid', null, undefined]) {
      expect([key, isProviderChoiceError(key)]).toEqual([key, false])
    }
  })

  test('every language has the chip texts, and no "Now using" text', () => {
    const keys = Object.keys(en.common.aiAssistant.providerChip).sort()
    expect(keys).toEqual([
      'answerWith',
      'chooseAnother',
      'defaultFailed',
      'isDefault',
      'makeDefault',
      'manage',
      'missing',
      'none',
      'removedNotice',
      'title',
    ])
    for (const [lang, resource] of Object.entries(resources)) {
      const chip = resource.common.aiAssistant.providerChip
      expect([lang, Object.keys(chip).sort()]).toEqual([lang, keys])
      expect([lang, resource.common.aiEngine.nowUsing]).toEqual([lang, undefined])
    }
    for (const lang of ['ru', 'mn']) {
      expect(resources[lang].common.aiAssistant.providerChip.removedNotice).toMatch(/[Ѐ-ӿ]/)
    }
  })
})
