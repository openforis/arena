import type { AiProviderEntry } from '@webapp/ai/engines/types'
import { getHostingIconClass, NEUTRAL_HOSTING_ICON } from '@webapp/components/ai/hostingIcons'
import { getProviderChipFullLabel } from '@webapp/components/ai/Assistant/providerChip/providerChipModel'
import { fakeT as t } from '../utils/fakeT'

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

/** Test translation function: prefixes the key. */

describe('provider chip labels and icons (406)', () => {
  test('each hosting class has its icon, and an unknown location gets a neutral one', () => {
    expect(getHostingIconClass('cloud')).toBe('icon-cloud')
    expect(getHostingIconClass('orgHosted')).toBe('icon-office')
    expect(getHostingIconClass('onDevice')).toBe('icon-laptop')
    expect(getHostingIconClass(null)).toBe(NEUTRAL_HOSTING_ICON)
    expect(getHostingIconClass(undefined)).toBe(NEUTRAL_HOSTING_ICON)
    // not the icon of a real location: a missing provider is not "on this computer"
    expect(NEUTRAL_HOSTING_ICON).not.toBe(getHostingIconClass('onDevice'))
  })

  test('a provider that can answer is named with where it runs', () => {
    expect(getProviderChipFullLabel({ view: { kind: 'provider', entry: ACCOUNT, tone: 'ok' }, t })).toBe(
      'My OpenAI · gpt-x · userAiSettings:where.cloudOwnKey'
    )
  })

  test('a provider that cannot answer says so in words, not only in colour', () => {
    expect(getProviderChipFullLabel({ view: { kind: 'provider', entry: ACCOUNT, tone: 'bad' }, t })).toBe(
      'My OpenAI · gpt-x · userAiSettings:where.cloudOwnKey · userAiSettings:status.notAvailable'
    )
  })

  test('a provider without a known location is named without it', () => {
    const entry: AiProviderEntry = { ...ACCOUNT, hostingClass: null }
    expect(getProviderChipFullLabel({ view: { kind: 'provider', entry, tone: 'ok' }, t })).toBe('My OpenAI · gpt-x')
  })

  test('the missing default and the empty chip have their own text', () => {
    expect(getProviderChipFullLabel({ view: { kind: 'missing' }, t })).toBe('aiAssistant.providerChip.missing')
    expect(getProviderChipFullLabel({ view: { kind: 'none' }, t })).toBe('aiAssistant.providerChip.none')
  })
})
