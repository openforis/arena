import * as A from '@core/arena'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { FormPropertyItem } from './FormPropertyItem'

const controlPointsOptions = [0, 4, 5, 10, 12, 21]

type CircleOnlyItemsProps = {
  readOnly: boolean
  onPropertyChange?: (...args: any[]) => any
  samplingPolygonObject?: Record<string, any>
  getFieldValidation?: (...args: any[]) => any
}

export const CircleOnlyItems = (props: CircleOnlyItemsProps) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForCircle = [{ key: 'radius', allowNegative: false }]
  return (
    <>
      <FormItem label="samplingPolygonOptions.numberOfControlPoints">
        <Dropdown
          items={controlPointsOptions}
          itemLabel={A.identity}
          itemValue={A.identity}
          selection={samplingPolygonObject.numberOfPointsCircle}
          onChange={onPropertyChange('numberOfPointsCircle')}
        />
      </FormItem>
      {inputPropertiesForCircle.map(({ key, allowNegative }) => (
        <FormPropertyItem
          key={key}
          allowNegative={allowNegative}
          getFieldValidation={getFieldValidation}
          objectKey={key}
          onPropertyChange={onPropertyChange(key)}
          readOnly={readOnly}
          samplingPolygonObject={samplingPolygonObject}
          value={samplingPolygonObject[key]}
        />
      ))}
    </>
  )
}
