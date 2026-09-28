import './WhatsNew.scss'

import { useCallback, useState } from 'react'

import { Button } from '../buttons'
import { Checkbox } from '../form'
import { Modal, ModalBody, ModalFooter } from '../modal'
import { WhatsNewCarousel } from './WhatsNewCarousel'
import { useWhatsNewUnseenItems } from './useWhatsNew'

/**
 * Dialog shown automatically when there are "What's new" items not dismissed yet by the current user.
 * If closed without checking "Don't show these again", it will be shown again on the next page load.
 *
 * @returns {React.ReactElement|null} - The dialog, if there are unseen items.
 */
export const WhatsNewDialog = () => {
  const { unseenItems, markItemsAsSeen } = useWhatsNewUnseenItems()

  const [closed, setClosed] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const onClose = useCallback(() => {
    setClosed(true)
    if (dontShowAgain) {
      markItemsAsSeen(unseenItems)
    }
  }, [dontShowAgain, markItemsAsSeen, unseenItems])

  if (closed || unseenItems.length === 0) return null

  return (
    <Modal className="whats-new-dialog" onClose={onClose} showCloseButton title="whatsNew:title">
      <ModalBody>
        <WhatsNewCarousel items={unseenItems} />
      </ModalBody>
      <ModalFooter>
        <Checkbox checked={dontShowAgain} label="whatsNew:dontShowAgain" onChange={setDontShowAgain} />
        <Button className="modal-footer__item" label="common.close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  )
}
