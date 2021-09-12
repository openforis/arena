import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as UserAccessRequest from '@core/user/userAccessRequest'

import { useI18n } from '@webapp/store/system'

import * as DateUtils from '@core/dateUtils'

const iconByStatus = ({ i18n }) => ({
  [UserAccessRequest.status.ACCEPTED]: (
    <span className="icon icon-checkmark accepted" title={i18n.t('usersAccessRequest.status.ACCEPTED')} />
  ),
  [UserAccessRequest.status.CREATED]: (
    <span className="icon icon-clock pending" title={i18n.t('usersAccessRequest.status.CREATED')} />
  ),
})

const Row = (props) => {
  const { row: userAccessRequest } = props

  const i18n = useI18n()

  const { status } = userAccessRequest

  return (
    <>
      {UserAccessRequest.editableFields.map(({ name }) => (
        <div key={name}>{R.pathOr('', name.split('.'), userAccessRequest)}</div>
      ))}
      <div>{DateUtils.formatDateTimeDefault(UserAccessRequest.getDateCreated(userAccessRequest))}</div>
      <div>{iconByStatus({ i18n })[status]}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
