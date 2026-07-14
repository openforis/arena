import React from 'react'

import { useI18n } from '@webapp/store/system'

/**
 * Column titles for the User Groups list table.
 *
 * @returns {React.ReactElement} - The RowHeader component.
 */
const RowHeader = (): React.ReactElement => {
  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('usersView:userGroup.name')}</div>
      <div>{i18n.t('usersView:userGroup.label')}</div>
      <div>{i18n.t('usersView:userGroup.qualifiers')}</div>
      <div>{i18n.t('usersView:userGroup.members')}</div>
    </>
  )
}

export default RowHeader
