import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { EntitySelector, AttributesSelector } from '@webapp/components/survey/NodeDefsSelector'

/*
this is going to be a panel with 3 modes:

basic -> chose between templates and allow the user to modify some basic fields:
f.e: in arc chart choose the radius, the nodeDef to categorize and if there are some groups the nodeDef of the group
custom -> [ customize the charts based on different properties -> the most complex to implement ]
the most complex to implement ]
advanced -> define the spec using a JSON editor

Now we have a panel on the left to choose the entity and the columns, but now the only thing needed is the entity so maybe we should replace that.

Also maybe is a good idea to try to do this panelRight agnostic of "nodeDefs" I mean give some way to get the variables from outside.
*/

const Panel = ({ setEntityDefUuid, entityDefUuid, setDimensionDefUuids, dimensionDefUuids }) => {
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()

  const onToggleDimension = (nodeDefUuid) => {
    const dimensionsUpdate = dimensionDefUuids.includes(nodeDefUuid) ? [] : [nodeDefUuid]
    /*? dimensionDefUuids.filter((uuid) => uuid !== nodeDefUuid)
      : [...dimensionDefUuids, nodeDefUuid]*/
    setDimensionDefUuids(dimensionsUpdate)
  }

  return (
    <div className="charts_panel__container">
      <p>{i18n.t('nodeDefsTypes.entity')}</p>
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        lang={lang}
        nodeDefUuidEntity={entityDefUuid}
        onChange={setEntityDefUuid}
        showSingleEntities={false}
        disabled={false}
        useNameAsLabel={true}
      />

      <br />
      <p>{i18n.t('common.dimension')}</p>

      <AttributesSelector
        filterTypes={[NodeDef.nodeDefType.code]}
        lang={lang}
        nodeDefUuidEntity={entityDefUuid}
        nodeDefUuidsAttributes={dimensionDefUuids}
        showAncestorsLabel={true}
        showMultipleAttributes={true}
        onToggleAttribute={onToggleDimension}
      />
    </div>
  )
}

Panel.propTypes = {
  setEntityDefUuid: PropTypes.func.isRequired,
  entityDefUuid: PropTypes.string.isRequired,
  setDimensionDefUuids: PropTypes.func.isRequired,
  dimensionDefUuids: PropTypes.arrayOf(String).isRequired,
}

export default Panel
