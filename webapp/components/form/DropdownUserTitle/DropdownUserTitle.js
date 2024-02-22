import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const titleItems = User.titleKeysArray.map((value) => ({ value }))

const DropdownUserTitle = (props) => {
  const { disabled, user, onChange, validation } = props
  const titleSelected = User.getTitle(user)
  const itemSelected = A.isEmpty(titleSelected) ? undefined : { value: titleSelected }

  const i18n = useI18n()

  return (
    <Dropdown
      disabled={disabled}
      placeholder={i18n.t('user.title')}
      onChange={(item) => onChange(User.assocTitle(item?.value)(user))}
      items={titleItems}
      itemLabel={(item) => i18n.t(`user.titleValues.${item.value}`)}
      selection={itemSelected}
      validation={validation}
    />
  )
}

DropdownUserTitle.propTypes = {
  disabled: PropTypes.bool,
  user: PropTypes.any.isRequired,
  validation: PropTypes.any,
  onChange: PropTypes.func.isRequired,
}

DropdownUserTitle.defaultProps = {
  disabled: false,
  validation: {},
}

export default DropdownUserTitle
