import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import { ButtonIconInfo } from '@webapp/components/buttons'
import { State } from './store'

const CoordinateProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.coordinateProps.allowOnlyDeviceCoordinate')}>
        <div className="form-item_body checkbox-with-info">
          <ButtonIconInfo title="nodeDefEdit.coordinateProps.allowOnlyDeviceCoordinateInfo" />
          <Checkbox
            checked={NodeDef.isAllowOnlyDeviceCoordinate(nodeDef)}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.allowOnlyDeviceCoordinate, value })}
          />
        </div>
      </FormItem>
      <FormItem label={i18n.t('nodeDefEdit.additionalFields')}>
        <div className="display-flex">
          <Checkbox
            checked={NodeDef.isAccuracyIncluded(nodeDef)}
            label="surveyForm.nodeDefCoordinate.accuracy"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeAccuracy, value })}
          />
          <Checkbox
            checked={NodeDef.isElevationIncluded(nodeDef)}
            label="surveyForm.nodeDefCoordinate.elevation"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeElevation, value })}
          />
          <Checkbox
            checked={NodeDef.isElevationAccuracyIncluded(nodeDef)}
            label="surveyForm.nodeDefCoordinate.elevationAccuracy"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeElevationAccuracy, value })}
          />
        </div>
      </FormItem>
    </>
  )
}

CoordinateProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CoordinateProps
