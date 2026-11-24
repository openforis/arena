import { FormPropertyItem } from './FormPropertyItem'

type RectangleOnlyItemsProps = {
  readOnly: boolean
  onPropertyChange?: (...args: any[]) => any
  samplingPolygonObject?: Record<string, any>
  getFieldValidation?: (...args: any[]) => any
}

export const RectangleOnlyItems = (props: RectangleOnlyItemsProps) => {
  const { onPropertyChange, samplingPolygonObject, readOnly, getFieldValidation } = props
  const inputPropertiesForRectangle = [
    { key: 'lengthLatitude', allowNegative: false },
    { key: 'lengthLongitude', allowNegative: false },
    { key: 'numberOfPointsNorth', allowNegative: false },
    { key: 'numberOfPointsEast', allowNegative: false },
  ]
  return (
    <>
      {inputPropertiesForRectangle.map(({ key, allowNegative }) => (
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
