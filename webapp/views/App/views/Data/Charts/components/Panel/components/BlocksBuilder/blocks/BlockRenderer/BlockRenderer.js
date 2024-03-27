import CheckboxBlock from '../Checkbox/Checkbox'
import ContainerBlock from '../Container/Container'
import InputBlock from '../Input/Input'
import MetricBlock from '../Metric/Metric'
import SelectBlock from '../Select/SelectBlock'
import SingleMetricBlock from '../SingleMetric/SingleMetric'
import SliderBlock from '../Slider/Slider'

const RenderByType = {
  container: ContainerBlock,
  select: SelectBlock,
  metric: MetricBlock,
  singleMetric: SingleMetricBlock,
  input: InputBlock,
  slider: SliderBlock,
  checkbox: CheckboxBlock,
}

export default RenderByType
