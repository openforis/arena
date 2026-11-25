import { ButtonIconEdit } from '@webapp/components'
import { useNodeDefByUuid, useSurveyPreferredLang } from '@webapp/store/survey'

type RowProps = {
  item: Record<string, any>
  onRowOpen: (...args: any[]) => any
}

const Row = (props: RowProps) => {
  const { item: entity, onRowOpen } = props
  const parentDef = useNodeDefByUuid(entity?.parentUuid)
  const lang = useSurveyPreferredLang()

  return (
    <>
      <div />
      <div>{entity?.props?.name}</div>
      <div>{entity?.props?.labels?.[lang]}</div>
      <div>{parentDef?.props?.name}</div>
      <div>
        <ButtonIconEdit onClick={() => onRowOpen(entity)} />
      </div>
    </>
  )
}

export default Row
