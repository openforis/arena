import { useState } from 'react'

import { Query, Sort, SortCriteria } from '@common/model/query'

import { Button, ButtonIconClose } from '@webapp/components/buttons'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import SortEditor from './SortEditor'
import { QuerySidebarSection } from './QuerySidebarSection'

type Props = {
  disabled: boolean
}

/**
 * Sidebar section listing the sort criteria: the order can be toggled and a criterion removed in place.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The sort section.
 */
export const QuerySortSection = (props: Props) => {
  const { disabled } = props

  const i18n = useI18n()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const [editorOpen, setEditorOpen] = useState(false)

  const sort = Query.getSort(query)
  const updateSort = (sortUpdated: any) => onChangeQuery(Query.assocSort(sortUpdated)(query))

  const toggleOrder = (index: number, sortCriteria: any) => {
    const sortCriteriaUpdated = SortCriteria.isOrderAsc(sortCriteria)
      ? SortCriteria.assocOrderDesc(sortCriteria)
      : SortCriteria.assocOrderAsc(sortCriteria)
    updateSort(Sort.updateSortCriteria(index, sortCriteriaUpdated)(sort))
  }

  return (
    <QuerySidebarSection
      actions={
        !Sort.isEmpty(sort) && (
          <Button
            className="btn-s btn-transparent"
            disabled={disabled}
            iconClassName="icon-pencil2 icon-12px"
            onClick={() => setEditorOpen(true)}
            showLabel={false}
            label="common.edit"
            variant="text"
          />
        )
      }
      label="dataView:sort"
    >
      {sort.map((sortCriteria: any, index: number) => {
        const orderAsc = SortCriteria.isOrderAsc(sortCriteria)
        const orderLabel = i18n.t(`common.${SortCriteria.getOrder(sortCriteria)}ending`)
        const variableLabel = SortCriteria.getLabel(sortCriteria)
        return (
          <div key={SortCriteria.getVariable(sortCriteria)} className="query-sidebar__condition">
            <span className="query-sidebar__condition-text ellipsis" title={variableLabel}>
              {variableLabel}
            </span>
            <Button
              className="btn-s btn-transparent"
              disabled={disabled}
              iconClassName={`icon-${orderAsc ? 'sort-amount-asc' : 'sort-amount-desc'} icon-12px`}
              onClick={() => toggleOrder(index, sortCriteria)}
              showLabel={false}
              label="dataView:dataQuery.sidebar.toggleSortOrder"
              labelParams={{ order: orderLabel }}
              variant="text"
            />
            <ButtonIconClose
              className="btn-s btn-transparent"
              disabled={disabled}
              onClick={() => updateSort(Sort.deleteSortCriteria(index)(sort))}
              title="dataView:dataQuery.sidebar.remove"
              titleParams={{ name: variableLabel }}
            />
          </div>
        )
      })}
      {Sort.isEmpty(sort) && (
        <Button
          className="query-sidebar__btn-add"
          disabled={disabled}
          iconClassName="icon-plus icon-10px"
          label="dataView:dataQuery.sidebar.addSort"
          onClick={() => setEditorOpen(true)}
          size="small"
          variant="text"
        />
      )}

      {editorOpen && (
        <SortEditor
          query={query}
          onChange={(sortUpdated: any) => {
            updateSort(sortUpdated)
            setEditorOpen(false)
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </QuerySidebarSection>
  )
}
