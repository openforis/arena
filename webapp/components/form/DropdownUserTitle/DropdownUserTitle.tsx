import * as A from '@core/arena'
import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const titleItems = User.titleKeysArray.map((value) => ({ value }))

type DropdownUserTitleProps = {
  disabled?: boolean
  user: any
  validation?: any
  onChange: (...args: any[]) => any
}

const DropdownUserTitle = (props: DropdownUserTitleProps) => {
  const { disabled = false, onChange, user, validation = {} } = props
  const titleSelected = User.getTitle(user)
  const itemSelected = A.isEmpty(titleSelected) ? undefined : { value: titleSelected }

  const i18n = useI18n()

  return (
    <Dropdown
      className="dropdown-user-title"
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

export default DropdownUserTitle
