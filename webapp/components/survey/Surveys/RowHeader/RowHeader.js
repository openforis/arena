import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const RowHeader = (props) => {
  const { showStatus } = props
  const i18n = useI18n()

  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.owner')}</div>
      <div>{i18n.t('common.label')}</div>
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      {showStatus && <div>{i18n.t('homeView.surveyList.status')}</div>}
    </>
  )
}

RowHeader.propTypes = {
  showStatus: PropTypes.bool,
}

RowHeader.defaultProps = {
  showStatus: false,
}

export default RowHeader
