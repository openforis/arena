import ContainerBlock from '../Container/Container'
import MetricBlock from '../Metric/Metric'
import SelectBlock from '../Select/SelectBlock'
import InputBlock from '../Input/Input'
import SliderBlock from '../Slider/Slider'
import CheckboxBlock from '../Checkbox/Checkbox'

const RenderByType = {
  container: ContainerBlock,
  select: SelectBlock,
  metric: MetricBlock,
  input: InputBlock,
  slider: SliderBlock,
  checkbox: CheckboxBlock,
}

export default RenderByType
