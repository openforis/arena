import React from 'react'
import PropTypes from 'prop-types'

import { Messages } from '@openforis/arena-core'

import { Accordion, Markdown, PanelRight } from '@webapp/components'
import { useMessageNotifications } from '@webapp/store/ui'

export const MessageNotificationPanel = (props) => {
  const { onClose } = props
  const messages = useMessageNotifications()

  return (
    <PanelRight header="common.notification_other" onClose={onClose}>
      <Accordion
        items={messages.map((message) => ({
          defaultExpanded: true,
          title: Messages.getSubject(message),
          content: (
            <div className="message-notification">
              <div className="message-notification__body">
                <Markdown source={Messages.getBody(message)} />
              </div>
            </div>
          ),
        }))}
      />
    </PanelRight>
  )
}

MessageNotificationPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
}
