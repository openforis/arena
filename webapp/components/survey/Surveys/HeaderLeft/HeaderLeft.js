import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'

const HeaderLeft = (props) => {
  const { handleSearch, search } = props

  const i18n = useI18n()

  return (
    <header>
      <FormItem label={i18n.t('surveysView.filter')}>
        <input
          className="surveys__header-left__input-search"
          placeholder={i18n.t('surveysView.filterPlaceholder')}
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </FormItem>
    </header>
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
}

export default HeaderLeft
