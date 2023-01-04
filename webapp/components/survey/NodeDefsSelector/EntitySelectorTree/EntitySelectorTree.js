import './EntitySelectorTree.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { EntitySelectorTreeNode } from './EntitySelectorTreeNode'

const EntitySelectorTree = (props) => {
  const { getLabelSuffix, isDisabled, nodeDefUuidActive, onlyPages, onSelect } = props
  const survey = useSurvey()
  const i18n = useI18n()

  const [expanded, setExpanded] = useState(true)
  const toggleExpanded = () => setExpanded((prevState) => !prevState)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)

  return (
    <div className="entity-selector-tree">
      <div className="display-flex">
        <button
          type="button"
          className="btn-xs btn-toggle btn-expand"
          onClick={toggleExpanded}
          title={i18n.t(expanded ? 'common.collapse' : 'common.expand')}
        >
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
        getLabelSuffix={getLabelSuffix}
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
  getLabelSuffix: PropTypes.func,
  isDisabled: PropTypes.func,
  nodeDefUuidActive: PropTypes.string,
  onlyPages: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}

EntitySelectorTree.defaultProps = {
  getLabelSuffix: () => '',
  isDisabled: () => false,
  nodeDefUuidActive: null,
  onlyPages: false,
}

export { EntitySelectorTree }
