import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { Responsive, WidthProvider } from 'react-grid-layout'

import * as A from '@core/arena'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import NodeDefSwitch from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch'

import { NodeDefsActions, SurveyState } from '@webapp/store/survey'

import { useAuthCanEditSurvey } from '@webapp/store/user'

const ResponsiveGridLayout = WidthProvider(Responsive)

const NodeDefEntityFormGrid = (props) => {
  const { nodeDef, childDefs, recordUuid, node, edit, entry, preview, canEditRecord, canAddNode } = props

  const dispatch = useDispatch()

  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)

  const canEditDef = useAuthCanEditSurvey()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
    }, 200)
  }, [])

  const surveyInfo = Survey.getSurveyInfo(survey)

  let childNames = null
  if (ProcessUtils.isEnvDevelopment) {
    // ordered child def names used in tests
    const childUuids = NodeDefLayout.getLayoutChildrenItemIdsOrdered(surveyCycleKey)(nodeDef)
    childNames = childUuids.map((childUuid) => A.pipe(Survey.getNodeDefByUuid(childUuid), NodeDef.getName)(survey))
  }

  const onChangeLayout = (layout) => {
    if (window.innerWidth >= 480 && layout.length > 0) {
      dispatch(NodeDefsActions.putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: layout }))
    }
  }

  const columns = NodeDefLayout.getColumnsNo(surveyCycleKey)(nodeDef)
  const rdgLayout = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const nodeDefsInnerPage = NodeDefLayout.rejectNodeDefsWithPage(surveyCycleKey)(childDefs)

  return nodeDefsInnerPage.length > 0 ? (
    <div className="survey-form__node-def-entity-form-grid-wrapper" data-child-names={childNames}>
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={false}
        rowHeight={70}
        cols={{ lg: columns, md: columns, sm: columns, xs: columns, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout, xs: rdgLayout }}
        containerPadding={edit && canEditDef ? [15, 40] : [15, 15]}
        margin={[5, 5]}
        isDraggable={edit && canEditDef}
        isResizable={edit && canEditDef}
        compactType={null}
        useCSSTransforms={true}
        preventCollision={true}
        className={mounted ? 'mounted' : ''}
        onDragStop={onChangeLayout}
        onResizeStop={onChangeLayout}
      >
        {nodeDefsInnerPage.map((childDef) => (
          <div key={NodeDef.getUuid(childDef)} id={NodeDef.getUuid(childDef)}>
            <NodeDefSwitch
              edit={edit}
              entry={entry}
              preview={preview}
              recordUuid={recordUuid}
              surveyInfo={surveyInfo}
              surveyCycleKey={surveyCycleKey}
              nodeDef={childDef}
              parentNode={node}
              canEditDef={canEditDef}
              canEditRecord={canEditRecord}
              canAddNode={canAddNode}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  ) : null
}

NodeDefEntityFormGrid.propTypes = {
  nodeDef: PropTypes.any.isRequired,
  childDefs: PropTypes.array,
  recordUuid: PropTypes.string,

  node: PropTypes.object,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  preview: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  canAddNode: PropTypes.bool,
}

NodeDefEntityFormGrid.defaultProps = {
  childDefs: [],
  recordUuid: null,
  node: null,
  edit: false,
  entry: false,
  preview: false,
  canEditRecord: false,
  canAddNode: false,
}

export default NodeDefEntityFormGrid
