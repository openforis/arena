import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const Row = (props) => {
  const { row: entity } = props
  const i18n = useI18n()

  return (
    <>
      <div />
      <div>{entity?.props?.name}</div>
      <div>{entity?.props?.labels?.[i18n.lang]}</div>
      <div>{entity?.source_props?.name}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
