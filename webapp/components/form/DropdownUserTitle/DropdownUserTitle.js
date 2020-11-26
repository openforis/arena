import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const titleItems = User.titleKeys.map((key) => ({ key }))

const DropdownUserTitle = (props) => {
  const { user, onChange, validation } = props
  const titleSelected = User.getTitle(user)
  const itemSelected = A.isEmpty(titleSelected) ? undefined : { key: titleSelected }

  const i18n = useI18n()

  return (
    <Dropdown
      placeholder={i18n.t('user.title')}
      onChange={(item) => onChange(User.assocTitle(item?.key)(user))}
      items={titleItems}
      itemLabel={(item) => i18n.t(`user.titleValues.${item.key}`)}
      selection={itemSelected}
      validation={validation}
    />
  )
}

DropdownUserTitle.propTypes = {
  user: PropTypes.any.isRequired,
  validation: PropTypes.any,
  onChange: PropTypes.func.isRequired,
}

DropdownUserTitle.defaultProps = {
  validation: {},
}

export default DropdownUserTitle
