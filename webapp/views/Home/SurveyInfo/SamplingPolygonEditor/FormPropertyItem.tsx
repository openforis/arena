import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

type FormPropertyItemProps = {
  allowNegative?: boolean
  getFieldValidation?: (...args: any[]) => any
  objectKey?: string
  onPropertyChange?: (...args: any[]) => any
  readOnly: boolean
  samplingPolygonObject?: Record<string, any>
  value?: any
}

export const FormPropertyItem = (props: FormPropertyItemProps) => {
  const {
    allowNegative = true,
    getFieldValidation,
    objectKey,
    onPropertyChange,
    readOnly,
    samplingPolygonObject,
    value,
  } = props
  return (
    <FormItem label={`samplingPolygonOptions.${objectKey}`}>
      <Input
        id={`sampling-polygon-${objectKey}`}
        numberFormat={NumberFormats.integer({ allowNegative })}
        onChange={onPropertyChange}
        readOnly={readOnly}
        validation={getFieldValidation(samplingPolygonObject[objectKey])}
        value={value}
      />
    </FormItem>
  )
}
