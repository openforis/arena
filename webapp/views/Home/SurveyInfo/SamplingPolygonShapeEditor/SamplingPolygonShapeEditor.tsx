import { FormItem } from '@webapp/components/form/Input'
import { ButtonGroup } from '@webapp/components/form'

const buttonGroupItems = ['true', 'false'].map((value) => ({
  key: value,
  label: `samplingPolygonOptions.${value === 'true' ? 'circle' : 'rectangle'}`,
}))

type SamplingPolygonShapeEditorProps = {
  readOnly: boolean
  isCircle?: boolean
  onChange?: (...args: any[]) => any
}

const SamplingPolygonShapeEditor = (props: SamplingPolygonShapeEditorProps) => {
  const { readOnly, isCircle, onChange } = props

  return (
    <FormItem label="samplingPolygonOptions.shape">
      <ButtonGroup
        disabled={readOnly}
        items={buttonGroupItems}
        onChange={onChange}
        selectedItemKey={String(isCircle)}
      />
    </FormItem>
  )
}

export default SamplingPolygonShapeEditor
