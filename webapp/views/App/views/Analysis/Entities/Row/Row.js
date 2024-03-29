import React from 'react'
import PropTypes from 'prop-types'

import { useNodeDefByUuid, useSurveyPreferredLang } from '@webapp/store/survey'

const Row = (props) => {
  const { row: entity } = props
  const parentDef = useNodeDefByUuid(entity?.parentUuid)
  const lang = useSurveyPreferredLang()

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
