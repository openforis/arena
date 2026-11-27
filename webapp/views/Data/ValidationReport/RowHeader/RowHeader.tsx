import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

type RowHeaderProps = {
  handleSortBy: (...args: any[]) => any
  sort: Record<string, any>
  askAssistantAvailable?: boolean
}

const RowHeader = ({ handleSortBy, sort, askAssistantAvailable = false }: RowHeaderProps) => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="path" />
        {i18n.t('common.path')}
      </div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="message" />
        {i18n.t('common.messages')}
      </div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field="owner" />
        {i18n.t('common.owner')}
      </div>
      <div />
      {askAssistantAvailable && <div />}
    </>
  )
}

export default RowHeader
