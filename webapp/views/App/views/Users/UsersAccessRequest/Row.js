import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as UserAccessRequest from '@core/user/userAccessRequest'

import { DataTestId } from '@webapp/utils/dataTestId'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

import * as DateUtils from '@core/dateUtils'

const Row = (props) => {
  const { row: userAccessRequest } = props
  const surveyInfo = useSurveyInfo()

  const i18n = useI18n()

  // const invitedDate = User.getInvitedDate(userListItem)

  return (
    <>
      {UserAccessRequest.editableFields.map(({ name }) => (
        <div key={name}>{R.pathOr('', name.split('.'), userAccessRequest)}</div>
      ))}
      <div>{DateUtils.formatDateTimeDefault(UserAccessRequest.getDateCreated(userAccessRequest))}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
