import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import Header from '@webapp/components/header'
import { FormItem } from '@webapp/components/form/Input'

const HeaderLeft = (props) => {
  const { handleSearch, search, title } = props

  const i18n = useI18n()

  return (
    <Header>
      <h6>{i18n.t(title)}</h6>

      <FormItem label={i18n.t('surveysView.filter')}>
        <input
          className="surveys__header-left__input-search"
          placeholder={i18n.t('surveysView.filterPlaceholder')}
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </FormItem>
    </Header>
  )
}

HeaderLeft.propTypes = {
  title: PropTypes.string.isRequired,
}

export default HeaderLeft
