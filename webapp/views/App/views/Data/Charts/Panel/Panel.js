import React from 'react'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

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

const Panel = ({ setEntityDefUuid, entityDefUuid }) => {
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()

  return (
    <div className="charts_panel__container">
      <p>{i18n.t('appModules.categories')}</p>
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        lang={lang}
        nodeDefUuidEntity={entityDefUuid}
        onChange={setEntityDefUuid}
        showSingleEntities={false}
        disabled={false}
        useNameAsLabel={true}
      />
    </div>
  )
}

/*
          <button
            onClick={() => setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'tree_health_label' } }))}
          >
            tree_health_label
          </button>
          <button
            onClick={() => setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'tree_origin_label' } }))}
          >
            tree_origin_label
          </button>

          <button
            onClick={() =>
              setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'cluster_accessibility_label' } }))
            }
          >
            cluster_accessibility_label
          </button>
          <button
            onClick={() =>
              setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'cluster_stratum_label' } }))
            }
          >
            cluster_stratum_label
          </button>

          <p>{JSON.stringify(chart, null, 2)}</p>
          */
export default Panel
