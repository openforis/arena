import './NodeDefTreeSelect.scss'

import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'
import { TreeView } from '@webapp/components/TreeView'
import { useNodeDefTreeSelect } from './useNodeDefTreeSelect'

const NodeDefTreeSelect = (props) => {
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
    expandButtonPlacement = 'inline',
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

  const collapseButtonVisible = treeItems?.length >= 1 && treeItems[0].items?.length > 0

  const expandButton = collapseButtonVisible ? (
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
  ) : null

  return (
    <div
      className={classNames('nodedef-tree-select', {
        'nodedef-tree-select--expand-above': expandButtonPlacement === 'above',
      })}
    >
      {expandButtonPlacement === 'above' && expandButton && (
        <div className="nodedef-tree-select__toolbar">{expandButton}</div>
      )}
      {expandButtonPlacement === 'inline' && expandButton && <div className="display-flex">{expandButton}</div>}

      <TreeView
        disableSelection={disableSelection}
        expadedItemKeys={expandedNodeDefUuids}
        items={treeItems}
        onExpandedItemKeysChange={setExpandedNodeDefUuids}
        onSelectedItemKeysChange={onSelectedTreeItemKeyChange}
        selectedItemKeys={selectedTreeItemKeys}
        renderItemSuffix={renderItemSuffix}
      />
    </div>
  )
}

NodeDefTreeSelect.propTypes = {
  disableSelection: PropTypes.bool,
  getLabelSuffix: PropTypes.func,
  isNodeDefDisabled: PropTypes.func,
  isNodeDefIncluded: PropTypes.func,
  nodeDefLabelType: PropTypes.string,
  nodeDefUuidActive: PropTypes.string,
  includeMultipleAttributes: PropTypes.bool,
  includeSingleAttributes: PropTypes.bool,
  includeSingleEntities: PropTypes.bool,
  onlyPages: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  expandButtonPlacement: PropTypes.oneOf(['inline', 'above']),
  renderItemSuffix: PropTypes.func,
}

export { NodeDefTreeSelect }
