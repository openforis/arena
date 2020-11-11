import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const titleItems = ['mr', 'ms', 'preferNotToSay'].map((key) => ({ key }))

const DropdownUserTitle = (props) => {
  const { user, onChange } = props
  const titleSelected = User.getTitle(user)
  const itemSelected = A.isEmpty(titleSelected) ? undefined : { key: titleSelected }

  const i18n = useI18n()

  return (
    <Dropdown
      placeholder={i18n.t('common.title')}
      onChange={(title) => onChange(User.assocTitle(title.key)(user))}
      items={titleItems}
      itemLabel={(title) => i18n.t(`user.title.${title.key}`)}
      selection={itemSelected}
    />
  )
}

DropdownUserTitle.defaultProps = {
  user: {},
  onChange: null,
}

DropdownUserTitle.propTypes = {
  user: PropTypes.any,
  onChange: PropTypes.func,
}

export default DropdownUserTitle
