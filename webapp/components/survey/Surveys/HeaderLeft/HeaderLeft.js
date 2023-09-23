import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import { TextInput } from '@webapp/components/form'

const HeaderLeft = (props) => {
  const { handleSearch, search } = props

  const i18n = useI18n()

  return (
    <div>
      <FormItem label={i18n.t('surveysView.filter')}>
        <TextInput
          className="surveys__header-left__input-search"
          defaultValue={search}
          onChange={(val) => {
            handleSearch(val)
          }}
          placeholder="surveysView.filterPlaceholder"
        />
      </FormItem>
    </div>
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
}

export default HeaderLeft
