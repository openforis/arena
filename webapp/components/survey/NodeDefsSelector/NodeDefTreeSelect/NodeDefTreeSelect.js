import './NodeDefTreeSelect.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'
import { TreeView } from '@webapp/components/TreeView'
import { useNodeDefTreeSelect } from './useNodeDefTreeSelect'

const NodeDefTreeSelect = (props) => {
  const {
    getLabelSuffix = () => '',
    isDisabled = () => false,
    includeMultipleAttributes = false,
    includeSingleAttributes = false,
    includeSingleEntities = false,
    nodeDefLabelType = null,
    nodeDefUuidActive = null,
    onlyPages = false,
    onSelect,
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
    isDisabled,
    nodeDefLabelType,
    nodeDefUuidActive,
    includeMultipleAttributes,
    includeSingleAttributes,
    includeSingleEntities,
    onlyPages,
    onSelect,
  })

  const collapseButtonVisible = treeItems?.length >= 1 && treeItems[0].items?.length > 0

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
        expadedItemKeys={expandedNodeDefUuids}
        items={treeItems}
        onExpandedItemKeysChange={setExpandedNodeDefUuids}
        onSelectedItemKeysChange={onSelectedTreeItemKeyChange}
        selectedItemKeys={selectedTreeItemKeys}
      />
    </div>
  )
}

NodeDefTreeSelect.propTypes = {
  getLabelSuffix: PropTypes.func,
  isDisabled: PropTypes.func,
  nodeDefLabelType: PropTypes.string,
  nodeDefUuidActive: PropTypes.string,
  includeMultipleAttributes: PropTypes.bool,
  includeSingleAttributes: PropTypes.bool,
  includeSingleEntities: PropTypes.bool,
  onlyPages: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}

export { NodeDefTreeSelect }
