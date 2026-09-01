import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { ColorInput } from '@webapp/components/ColorInput'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import { ButtonIconInfo } from '@webapp/components/buttons'
import { State, useNodeDefEditReadOnly } from './store'

const CoordinateProps = (props) => {
  const { state, Actions } = props

  const readOnly = useNodeDefEditReadOnly()
  const nodeDef = State.getNodeDef(state)
  const mapMarkerColor = NodeDef.getMapMarkerColor(nodeDef) ?? ''

  return (
    <>
      <FormItem label="nodeDefEdit.coordinateProps.allowOnlyDeviceCoordinate">
        <div className="form-item_body checkbox-with-info">
          <ButtonIconInfo title="nodeDefEdit.coordinateProps.allowOnlyDeviceCoordinateInfo" />
          <Checkbox
            checked={NodeDef.isAllowOnlyDeviceCoordinate(nodeDef)}
            disabled={readOnly}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.allowOnlyDeviceCoordinate, value })}
          />
        </div>
      </FormItem>

      <FormItem label="nodeDefEdit.additionalFields">
        <div className="display-flex">
          <Checkbox
            checked={NodeDef.isAccuracyIncluded(nodeDef)}
            disabled={readOnly}
            label="surveyForm:nodeDefCoordinate.accuracy"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeAccuracy, value })}
          />
          <Checkbox
            checked={NodeDef.isAltitudeIncluded(nodeDef)}
            disabled={readOnly}
            label="surveyForm:nodeDefCoordinate.altitude"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeAltitude, value })}
          />
          <Checkbox
            checked={NodeDef.isAltitudeAccuracyIncluded(nodeDef)}
            disabled={readOnly}
            label="surveyForm:nodeDefCoordinate.altitudeAccuracy"
            onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.includeAltitudeAccuracy, value })}
          />
        </div>
      </FormItem>
      <FormItem label="nodeDefEdit.coordinateProps.mapMarkerColor">
        <ColorInput
          disabled={readOnly}
          value={mapMarkerColor}
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.mapMarkerColor, value })}
        />
      </FormItem>
    </>
  )
}

CoordinateProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CoordinateProps
