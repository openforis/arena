import * as AuthGroup from '@core/auth/authGroup'
import * as i18nFactory from '@core/i18n/i18nFactory'

import { UserInviteEmail } from '@server/modules/user/service/userInviteEmail'

const msgKeys = ['emails:userInvite', 'emails:userInviteExistingUser']

const renderEmail = async (params: { msgKey: string; message?: string }) => {
  const { msgKey, message } = params
  const i18n = await i18nFactory.createI18nAsync('en')
  const msgParams = {
    ...UserInviteEmail.getMsgParams({
      i18n,
      invitingUserName: 'Mr Test',
      serverUrl: 'https://arena.example.org',
      surveyName: 'arena_demo',
      surveyLabel: 'Arena demo',
      groupName: AuthGroup.groupNames.dataEditor,
      message,
    }),
    urlResetPassword: 'https://arena.example.org/guest/resetPassword/uuid',
  }
  return { subject: i18n.t(`${msgKey}.subject`, msgParams), body: i18n.t(`${msgKey}.body`, msgParams) }
}

describe('User invite email', () => {
  test.each(msgKeys)('%s has no unresolved placeholders', async (msgKey) => {
    const { subject, body } = await renderEmail({ msgKey })
    expect(subject).not.toMatch(/\{\{|\$t\(|undefined/)
    expect(body).not.toMatch(/\{\{|\$t\(|undefined/)
  })

  test.each(msgKeys)('%s body contains the role and its permissions', async (msgKey) => {
    const { body } = await renderEmail({ msgKey })
    expect(body).toContain("join the Open Foris Arena survey 'arena_demo - Arena demo' as Data editor</p>")
    expect(body).toContain('With the role of <b>Data editor</b>')
    expect(body).toContain('<li>add new records (own surveys)</li>')
  })

  test('body contains the invitation message', async () => {
    const { body } = await renderEmail({ msgKey: msgKeys[1], message: '<p>Welcome!</p>' })
    expect(body).toContain('<p>Welcome!</p>')
  })
})
