import './BaseUnitSelector.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

/*
    BASE_UNIT annotations
    The concept of BaseUnit is quite complex so this is the reason behind of this comments. 

    A base unit is a value contained into a Chain, 
    Some calculations based on some area are needed so this is the reason behind of the base unit.
    - 1.1 First the user has to select the entity that is the reference of the base units 
    - 1.2 Then for every entity below in the hierarchy of this "reference unit" a base unit nodedef analysis should be created 
    - 1.3 The first level (reference level) should have the name of weight -> the default script should be entity_reference_name$weight <- 1
    - 1.4 The children levels should receive the name with the subfix _area -> the default script should be entity_name_children$[entity_reference_name]_area <- NA

    So everytime that this selector changes e should delete all of the baseUnit nodeDefs and recreate all of this tree, 
    
    // TO DEFINE ->  I am not sure about the naming at this moment
    In addition of this, Into the quantitative nodes the user has the possibility to create "Area-based estimate nodedefs" with the following scripts -> entity_name$node_def_name <- entity_name$[tree_volume] / tree$plot_area
*/

const BaseUnitSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()

  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onBaseUnitChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocBaseUnitNodeDefUuid(entityDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  if (!chain || A.isEmpty(chain)) return null

  return (
    <FormItem label={i18n.t('common.baseUnit')} className="node-def-edit__base-unit">
      <div className="node-def-edit__base-unit-selector">
        <EntitySelector
          hierarchy={Survey.getHierarchy()(survey)}
          nodeDefUuidEntity={ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesign)}
          onChange={onBaseUnitChange}
          showSingleEntities={false}
          useNameAsLabel={true}
          allowEmptySelection={true}
        />
      </div>
    </FormItem>
  )
}

export default BaseUnitSelector
