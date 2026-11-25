import './NodeDefTreeSelect.scss'

import classNames from 'classnames'

import type { NodeDefLabelType } from '@core/survey/nodeDef'
import { Button } from '@webapp/components/buttons'
import { TreeView } from '@webapp/components/TreeView'

import { useNodeDefTreeSelect } from './useNodeDefTreeSelect'

type NodeDefTreeSelectProps = {
  disableSelection?: boolean
  getLabelSuffix?: (...args: any[]) => any
  isNodeDefDisabled?: (...args: any[]) => any
  isNodeDefIncluded?: (...args: any[]) => any
  nodeDefLabelType?: NodeDefLabelType
  nodeDefUuidActive?: string
  includeMultipleAttributes?: boolean
  includeSingleAttributes?: boolean
  includeSingleEntities?: boolean
  onlyPages?: boolean
  onSelect: (...args: any[]) => any
  showExpandButton?: boolean
  renderItemPrefix?: (...args: any[]) => any
  renderItemSuffix?: (...args: any[]) => any
}

const NodeDefTreeSelect = (props: NodeDefTreeSelectProps) => {
  const {
    getLabelSuffix = () => '',
    disableSelection = false,
    isNodeDefDisabled = () => false,
    isNodeDefIncluded = () => true,
    includeMultipleAttributes = false,
    includeSingleAttributes = false,
    includeSingleEntities = false,
    nodeDefLabelType = null,
    nodeDefUuidActive = null,
    onlyPages = false,
    onSelect,
    showExpandButton = true,
    renderItemPrefix = undefined,
    renderItemSuffix = undefined,
  } = props

  const {
    expanded,
    expandedNodeDefUuids,
    onSelectedTreeItemKeyChange,
    selectedTreeItemKeys,
    setExpandedNodeDefUuids,
    toggleExpanded,
    treeItems,
  } = useNodeDefTreeSelect({
    getLabelSuffix,
    isNodeDefDisabled,
    isNodeDefIncluded,
    nodeDefLabelType,
    nodeDefUuidActive,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    onlyPages,
    onSelect,
  })

  const collapseButtonVisible = showExpandButton && treeItems?.length >= 1 && treeItems[0].items?.length > 0

  return (
    <div className="nodedef-tree-select">
      {collapseButtonVisible && (
        <div className="display-flex">
          <Button
            className="btn-toggle btn-expand"
            iconClassName={classNames('icon icon-12px', {
              'icon-shrink2': expanded,
              'icon-enlarge2': !expanded,
            })}
            onClick={toggleExpanded}
            size="small"
            title={expanded ? 'common.collapse' : 'common.expand'}
            variant="text"
          />
        </div>
      )}

      <TreeView
        disableSelection={disableSelection}
        expadedItemKeys={expandedNodeDefUuids}
        items={treeItems}
        onExpandedItemKeysChange={setExpandedNodeDefUuids}
        onSelectedItemKeysChange={onSelectedTreeItemKeyChange}
        selectedItemKeys={selectedTreeItemKeys}
        renderItemPrefix={renderItemPrefix}
        renderItemSuffix={renderItemSuffix}
      />
    </div>
  )
}

export { NodeDefTreeSelect }
