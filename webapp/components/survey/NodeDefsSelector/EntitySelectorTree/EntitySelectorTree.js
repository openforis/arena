import './EntitySelectorTree.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import { useSurvey } from '@webapp/store/survey'

import { EntitySelectorTreeNode } from './EntitySelectorTreeNode'

const EntitySelectorTree = (props) => {
  const { isDisabled, nodeDefUuidActive, onlyPages, onSelect } = props
  const survey = useSurvey()

  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => setExpanded((prevState) => !prevState)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)

  return (
    <div className="entity-selector-tree">
      <div className="display-flex">
        <button type="button" className="btn-xs btn-toggle btn-expand" onClick={toggleExpanded}>
          <span
            className={classNames('icon icon-12px', {
              'icon-shrink2': expanded,
              'icon-enlarge2': !expanded,
            })}
          />
        </button>
      </div>

      <EntitySelectorTreeNode
        expanded={expanded}
        isDisabled={isDisabled}
        nodeDef={nodeDefRoot}
        nodeDefUuidActive={nodeDefUuidActive}
        onlyPages={onlyPages}
        onSelect={onSelect}
        setExpanded={setExpanded}
      />
    </div>
  )
}

EntitySelectorTree.propTypes = {
  isDisabled: PropTypes.func,
  nodeDefUuidActive: PropTypes.string.isRequired,
  onlyPages: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}

EntitySelectorTree.defaultProps = {
  isDisabled: () => false,
  onlyPages: false,
}

export { EntitySelectorTree }
