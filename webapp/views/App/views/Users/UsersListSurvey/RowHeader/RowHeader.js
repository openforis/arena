import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const RowHeader = (props) => {
  const { emailVisible = false } = props
  const i18n = useI18n()

  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      {emailVisible && <div>{i18n.t('common.email')}</div>}
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.invitedBy')}</div>
      <div>{i18n.t('usersView.invitedDate')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
      <div>{i18n.t('usersView.lastLogin')}</div>
    </>
  )
}

RowHeader.propTypes = {
  emailVisible: PropTypes.bool,
}

export default RowHeader
