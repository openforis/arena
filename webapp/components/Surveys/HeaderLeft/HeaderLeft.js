import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import Header from '@webapp/components/header'

const HeaderLeft = (props) => {
  const { title } = props

  const i18n = useI18n()

  return (
    <Header>
      <h6>{i18n.t(title)}</h6>
    </Header>
  )
}

HeaderLeft.propTypes = {
  title: PropTypes.string.isRequired,
}

export default HeaderLeft
