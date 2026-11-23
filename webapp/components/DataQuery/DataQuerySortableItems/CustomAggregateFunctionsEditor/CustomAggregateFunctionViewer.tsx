import Checkbox from '@webapp/components/form/checkbox'
import { ButtonIconEdit } from '@webapp/components'

type CustomAggregateFunctionViewerProps = {
  fn: Record<string, any>
  selected: boolean
  onSelectionChange: (...args: any[]) => any
  setEditedUuid: (...args: any[]) => any
}

export const CustomAggregateFunctionViewer = (props: CustomAggregateFunctionViewerProps) => {
  const { fn, selected, onSelectionChange, setEditedUuid } = props
  const { name, uuid } = fn
  return (
    <>
      <div>
        <Checkbox checked={selected} onChange={() => onSelectionChange({ [uuid]: !selected })} />
      </div>
      <div className="ellipsis">{name}</div>
      <ButtonIconEdit onClick={() => setEditedUuid(uuid)} />
    </>
  )
}
