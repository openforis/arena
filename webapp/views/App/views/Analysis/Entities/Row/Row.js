import React from 'react'
import PropTypes from 'prop-types'

import { useNodeDefByUuid } from '@webapp/store/survey'
import { usePreferredLang } from '@webapp/store/user'

const Row = (props) => {
  const { row: entity } = props
  const parentDef = useNodeDefByUuid(entity?.parentUuid)
  const lang = usePreferredLang()

  return (
    <>
      <div />
      <div>{entity?.props?.name}</div>
      <div>{entity?.props?.labels?.[lang]}</div>
      <div>{parentDef?.props?.name}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
