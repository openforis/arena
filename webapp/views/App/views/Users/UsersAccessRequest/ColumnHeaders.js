import React from 'react'
import PropTypes from 'prop-types'

import * as UsersAccessRequest from '@core/user/userAccessRequest'

import { useI18n } from '@webapp/store/system'

const ColumnHeaders = () => {
  const i18n = useI18n()

  return (
    <>
      {UsersAccessRequest.editableFields.map(({ name }) => (
        <div key={name}>{i18n.t(`accessRequestView.fields.${name}`)}</div>
      ))}
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.status')}</div>
    </>
  )
}

ColumnHeaders.propTypes = {
  emailVisible: PropTypes.bool,
}

ColumnHeaders.defaultProps = {
  emailVisible: false,
}

export default ColumnHeaders
