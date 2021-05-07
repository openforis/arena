import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useNodeDefByUuid } from '@webapp/store/survey'

const Row = (props) => {
  const { row: entity } = props
  const i18n = useI18n()
  const parentDef = useNodeDefByUuid(entity.parentUuid)

  return (
    <>
      <div />
      <div>{entity?.props?.name}</div>
      <div>{entity?.props?.labels?.[i18n.lang]}</div>
      <div>{parentDef?.props?.name}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
