import * as i18nFactory from '@core/i18n/i18nFactory'

import { UserRegistrationExpiredEmail } from '@server/modules/user/service/userRegistrationExpiredEmail'

const { msgKey, getMsgParams } = UserRegistrationExpiredEmail

type Survey = { name: string; label?: string }

const renderEmail = async (params: { surveys?: Survey[]; serverUrl?: string }) => {
  const { surveys = [], serverUrl = '' } = params
  const i18n = await i18nFactory.createI18nAsync('en')
  const msgParams = getMsgParams({ i18n, surveys, serverUrl })
  return { subject: i18n.t(`${msgKey}.subject`, msgParams), body: i18n.t(`${msgKey}.body`, msgParams) }
}

describe('User registration expired email', () => {
  test('subject tells that the account has been removed', async () => {
    const { subject } = await renderEmail({})
    expect(subject).toBe('Your Open Foris Arena account has been removed')
  })

  test('body explains that the registration link has expired', async () => {
    const { body } = await renderEmail({})
    expect(body).toContain('was not completed within 7 days of receiving the registration link')
    expect(body).toContain('For this reason your account has been removed.')
  })

  test('body lists the deleted surveys', async () => {
    const { body } = await renderEmail({ surveys: [{ name: 'survey_a', label: 'Survey A' }, { name: 'survey_b' }] })
    expect(body).toContain('together with the following survey(s)')
    expect(body).toContain('<li><b>survey_a - Survey A</b></li>')
    expect(body).toContain('<li><b>survey_b</b></li>')
  })

  test('body does not mention surveys when none has been deleted', async () => {
    const { body } = await renderEmail({})
    expect(body).not.toContain('survey(s)')
    expect(body).not.toContain('<ul>')
  })

  test('survey labels are HTML escaped', async () => {
    const { body } = await renderEmail({ surveys: [{ name: 'survey_a', label: '<script>alert(1)</script>' }] })
    expect(body).not.toContain('<script>')
    expect(body).toContain('&lt;script&gt;')
  })

  test('body links to the server when its public URL is known', async () => {
    const { body } = await renderEmail({ serverUrl: 'https://arena.example.org' })
    expect(body).toContain('you can request access again here')
    expect(body).toContain('arena.example.org')
  })

  test('body does not invite to request access again when the public URL is unknown', async () => {
    const { body } = await renderEmail({})
    expect(body).not.toContain('request access again')
  })

  test('body has no unresolved placeholders', async () => {
    const { body } = await renderEmail({ surveys: [{ name: 'survey_a' }], serverUrl: 'https://arena.example.org' })
    expect(body).not.toMatch(/\{\{|\$t\(|undefined/)
  })
})
