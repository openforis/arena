import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from './store'
import { Checkbox } from '@webapp/components/form'

const CoordinateProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  return (
    <FormItem label={i18n.t('nodeDefEdit.coordinateProps.allowOnlyDeviceCoordinate')}>
      <Checkbox
        checked={NodeDef.isAllowOnlyDeviceCoordinate(nodeDef)}
        onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.allowOnlyDeviceCoordinate, value })}
      />
    </FormItem>
  )
}

CoordinateProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CoordinateProps
