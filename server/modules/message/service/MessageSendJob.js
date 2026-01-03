import { Messages, MessageNotificationType, MessageStatus, Objects } from '@openforis/arena-core'
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

/**
 * Replace template variables in message body.
 * Template variables:
 * - {{userTitleAndName}}: replaced with user's title and name (e.g. "Mr John")
 * - {{userName}}: replaced with user's name (e.g. "John").
 * @param {!object} params - Parameters object.
 * @param {!object} params.i18n - I18n instance.
 * @param {!string} params.body - Message body.
 * @param {!object} params.user - User object.
 * @returns {string} - Message body with template variables replaced.
 */
const replaceBodyTemplateVariables = ({ i18n, body, user }) => {
  const titleKey = User.getTitle(user)
  const name = User.getName(user)
  const titleAndNameParts = []
  if (Objects.isNotEmpty(name)) {
    titleAndNameParts.push(name)
  }
  if (Objects.isNotEmpty(titleKey) && User.titleKeys.preferNotToSay !== titleKey) {
    const title = i18n.t(`user.titleValues.${titleKey}`)
    titleAndNameParts.unshift(title)
  }
  const userTitleAndName = titleAndNameParts.length > 0 ? titleAndNameParts.join(' ') : 'User'
  const bodyFixed = body.replaceAll('{{userTitleAndName}}', userTitleAndName).replaceAll('{{userName}}', name ?? 'User')
  return bodyFixed
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

    const bodyMarkdown = parseMarkdown(Messages.getBody(message))

    for (const user of usersFiltered) {
      const bodyHtml = replaceBodyTemplateVariables({ i18n, body: bodyMarkdown, user })
      const to = User.getEmail(user)
      await Mailer.sendCustomEmail({ to, subject, html: bodyHtml })
      this.incrementProcessedItems()
    }

    this.logDebug(`Sent ${this.total} emails for message ${subject}`)
  }
}

MessageSendJob.type = 'MessageSendJob'
