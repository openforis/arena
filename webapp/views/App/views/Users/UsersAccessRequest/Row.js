import React, { useState } from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as DateUtils from '@core/dateUtils'

import { Button } from '@webapp/components/buttons'
import PanelRight from '@webapp/components/PanelRight'

import { useI18n } from '@webapp/store/system'

import { AcceptRequestPanel } from './AcceptRequestPanel'

const iconByStatus = ({ i18n }) => ({
  [UserAccessRequest.status.ACCEPTED]: (
    <span className="icon icon-checkmark accepted" title={i18n.t('usersAccessRequestView.status.ACCEPTED')} />
  ),
  [UserAccessRequest.status.CREATED]: (
    <span className="icon icon-clock pending" title={i18n.t('usersAccessRequestView.status.CREATED')} />
  ),
})

const Row = (props) => {
  const { row: userAccessRequest } = props

  const i18n = useI18n()

  const [acceptPanelVisible, setAcceptPanelVisible] = useState(false)

  const { status } = userAccessRequest

  return (
    <>
      {UserAccessRequest.editableFields.map(({ name }) => (
        <div key={name}>{R.pathOr('', name.split('.'), userAccessRequest)}</div>
      ))}
      <div>{DateUtils.formatDateTimeDefault(UserAccessRequest.getDateCreated(userAccessRequest))}</div>
      <div>{iconByStatus({ i18n })[status]}</div>
      <div>
        {status === UserAccessRequest.status.CREATED && (
          <Button label="accessRequestView.accept" onClick={() => setAcceptPanelVisible(true)} />
        )}
      </div>

      {acceptPanelVisible && (
        <PanelRight
          onClose={() => setAcceptPanelVisible(false)}
          header={i18n.t('accessRequestView.accept')}
          width="600px"
        >
          <AcceptRequestPanel userAccessRequest={userAccessRequest} />
        </PanelRight>
      )}
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
