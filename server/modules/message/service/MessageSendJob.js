import { Messages, MessageNotificationType, MessageStatus } from '@openforis/arena-core'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import * as i18nFactory from '@core/i18n/i18nFactory'
import { parseMarkdown } from '@core/markdownUtils'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import * as User from '@core/user/user'
import * as Mailer from '@server/utils/mailer'

const getMessageService = () => {
  // Ensure services are initialized
  const serviceRegistry = ArenaServer.initServices()
  return serviceRegistry.getService(ServerServiceType.message)
}

export default class MessageSendJob extends Job {
  constructor(params) {
    super(MessageSendJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { messageUuid } = context

    const messageService = getMessageService()
    const message = await messageService.getByUuid(messageUuid, tx)
    this.setContext({ message })

    const notificationTypes = Messages.getNotificationTypes(message)
    if (notificationTypes.includes(MessageNotificationType.Email)) {
      await this.notifyUsersByEmail()
    }
    // update message status to "Sent"
    const messageUpdated = Messages.assocStatus(MessageStatus.Sent)(message)
    await messageService.update(message.uuid, messageUpdated, tx)
  }

  async notifyUsersByEmail() {
    const i18n = await i18nFactory.createI18nAsync()

    const { context, tx } = this
    const { message } = context

    const users = await UserService.fetchUsers({ onlyAccepted: true }, tx)

    const usersFiltered = users.filter((user) => Messages.isTargetingUser(user)(message))

    this.total = usersFiltered.length

    const subject = Messages.getSubject(message)
    this.logDebug(`Sending ${this.total} emails for message ${subject}`)

    const bodyHtml = parseMarkdown(Messages.getBody(message))
    let messageWithBodyHtml = Messages.assocBody(bodyHtml)(message)

    for (const user of usersFiltered) {
      const messageWithReplacedVariables = Messages.replaceBodyTemplateVariables({ i18n, user })(messageWithBodyHtml)
      const bodyHtmlWithReplacedVariables = Messages.getBody(messageWithReplacedVariables)
      const to = User.getEmail(user)
      await Mailer.sendCustomEmail({ to, subject, html: bodyHtmlWithReplacedVariables })
      this.incrementProcessedItems()
    }

    this.logDebug(`Sent ${this.total} emails for message ${subject}`)
  }
}

MessageSendJob.type = 'MessageSendJob'
