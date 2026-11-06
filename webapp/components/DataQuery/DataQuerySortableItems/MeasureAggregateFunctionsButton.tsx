import { useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import { ButtonMenu, type ButtonMenuItem } from '@webapp/components/buttons'
import { AggregateFunctionsPanel } from './AggregateFunctionsPanel'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const defaultAggregateFunctions: string[] = Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS)

type Props = {
  disabled?: boolean
  nodeDef: any
}

/**
 * Menu to pick the aggregate functions (default and custom ones) of a measure; it also opens the custom functions editor.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement|null} - The menu button, or null for the entity count measure (not editable).
 */
export const MeasureAggregateFunctionsButton = (props: Props) => {
  const { disabled = false, nodeDef } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const [panelOpen, setPanelOpen] = useState(false)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  // the count of the context entity has no other aggregate function
  if (nodeDefUuid === Query.getEntityDefUuid(query)) return null

  const selectedFns: string[] = Query.getMeasureAggregateFunctions(nodeDefUuid)(query)
  const customFns: any[] = Object.values(NodeDef.getAggregateFunctions(nodeDef)).filter((fn: any) => !fn.placeholder)

  const getFnLabel = (aggregateFn: string): string =>
    defaultAggregateFunctions.includes(aggregateFn)
      ? i18n.t(`common.${aggregateFn}`)
      : (NodeDef.getAggregateFunctionByUuid(aggregateFn)(nodeDef)?.name ?? aggregateFn)

  const toFnItem = (aggregateFn: string, label: string): ButtonMenuItem => {
    const checked = selectedFns.includes(aggregateFn)
    return {
      key: aggregateFn,
      checked,
      // a measure needs at least one aggregate function
      disabled: checked && selectedFns.length === 1,
      label,
      labelIsI18nKey: false,
      onClick: () => onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFn })(query)),
    }
  }

  const fnsLabel = selectedFns.map(getFnLabel).join(', ')
  const title = i18n.t('dataView:dataQuery.sidebar.aggregateFunctionsOf', { name: NodeDef.getLabel(nodeDef, lang) })

  const items: ButtonMenuItem[] = [
    ...defaultAggregateFunctions.map((fn) => toFnItem(fn, i18n.t(`common.${fn}`))),
    ...customFns.map((fn) => toFnItem(fn.uuid, fn.name)),
    {
      key: 'manageCustom',
      closeMenuOnClick: true,
      iconClassName: 'icon-cog icon-12px',
      label: 'dataView:dataQuery.sidebar.customAggregateFunctions',
      onClick: () => setPanelOpen(true),
    },
  ]

  return (
    <>
      <ButtonMenu
        aria-label={`${title}: ${fnsLabel}`}
        className="data-query__aggregate-fns-btn"
        closeMenuOnItemClick={false}
        disabled={disabled}
        items={items}
        label={fnsLabel}
        labelIsI18nKey={false}
        title={title}
        titleIsI18nKey={false}
        variant="outlined"
      />
      {panelOpen && (
        <AggregateFunctionsPanel
          aggregateFunctions={selectedFns}
          nodeDef={nodeDef}
          onChangeQuery={onChangeQuery}
          onClose={() => setPanelOpen(false)}
          query={query}
        />
      )}
    </>
  )
}
