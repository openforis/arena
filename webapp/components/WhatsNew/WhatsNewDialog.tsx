import './WhatsNew.scss'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as User from '@core/user/user'
import { appModuleUri, helpModules } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'
import { Button } from '../buttons'
import { Checkbox } from '../form'
import { Modal, ModalBody, ModalFooter } from '../Modal'

import { useWhatsNewUnseenItems } from './useWhatsNew'
import { WhatsNewCarousel } from './WhatsNewCarousel'

/**
 * Dialog shown automatically when there are "What's new" items not dismissed yet by the current user.
 * If closed without checking "Don't show these again", it will be shown again on the next page load.
 *
 * @returns {React.ReactElement|null} - The dialog, if there are unseen items.
 */
export const WhatsNewDialog = () => {
  const { unseenItems, markItemsAsSeen } = useWhatsNewUnseenItems()
  const user = useUser()
  const navigate = useNavigate()

  const [closed, setClosed] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const onClose = useCallback(() => {
    setClosed(true)
    if (dontShowAgain) {
      markItemsAsSeen(unseenItems)
    }
  }, [dontShowAgain, markItemsAsSeen, unseenItems])

  const onShowChangelog = useCallback(() => {
    onClose()
    navigate(appModuleUri(helpModules.changelog))
  }, [navigate, onClose])

  if (closed || unseenItems.length === 0) return null

  return (
    <Modal className="whats-new-dialog" onClose={onClose} showCloseButton title="whatsNew:title">
      <ModalBody>
        <WhatsNewCarousel items={unseenItems} />
      </ModalBody>
      <ModalFooter>
        {User.canViewChangelog(user) && (
          <Button
            className="modal-footer__item whats-new-dialog__changelog-link"
            label="whatsNew:showChangelog"
            onClick={onShowChangelog}
            variant="text"
          />
        )}
        <Checkbox checked={dontShowAgain} label="whatsNew:dontShowAgain" onChange={setDontShowAgain} />
        <Button className="modal-footer__item" label="common.close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  )
}
