import './BaseUnitSelector.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import { useChain } from '@webapp/store/ui/chain'

import {
  useSurvey,
  useSurveyCycleKeys,
  useSurveyPreferredLang,
  useSurveyInfo,
  NodeDefsActions,
  useSurveyCycleKey,
} from '@webapp/store/survey'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'

import { ButtonSave, ButtonDelete } from '@webapp/components'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

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
  const [baseUnitNodeDef, setBaseUnitNodeDef] = useState(null)
  const [hadBaseUnitNodeDef, setHadBaseUnitNodeDef] = useState(false)
  const [baseUnitNodeDefsToCreate, setBaseUnitNodeDefsToCreate] = useState([])

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const dispatch = useDispatch()
  const cycleKeys = useSurveyCycleKeys()
  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const chain = useChain()
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)

  const handleSaveBaseUnitNodeDefs = useCallback(() => {
    dispatch(NodeDefsActions.createNodeDefs({ surveyId, surveyCycleKey, nodeDefs: baseUnitNodeDefsToCreate }))

    setBaseUnitNodeDef(baseUnitNodeDefsToCreate[0])
    setHadBaseUnitNodeDef(true)
    setBaseUnitNodeDefsToCreate([])
  }, [setBaseUnitNodeDef, baseUnitNodeDef, survey, baseUnitNodeDefsToCreate, setBaseUnitNodeDefsToCreate])

  const handleDeleteBaseUnit = useCallback(() => {
    dispatch(NodeDefsActions.resetBaseUnitNodeDefs({ surveyId, surveyCycleKey, chain }))
    setBaseUnitNodeDefsToCreate([])
    setHadBaseUnitNodeDef(false)
    setBaseUnitNodeDef(null)
  }, [surveyId, surveyCycleKey, chain])

  const handleUpdateBaseUnit = useCallback(
    (entityReferenceUuid) => {
      // TODO -> in case of changes or remove this nodedef we should:  ( Not needed at this moment )
      // -> deleteAllBaseUnitNodeDefs in chain to restart this base unit items ( add a new state with nodeDefsToDelete )
      // -> If entityReferenceUuid is null delete base unit node_defs -> this is solved with the previus line

      const referenceNodeDef = Survey.getNodeDefByUuid(entityReferenceUuid)(survey)
      if (A.isEmpty(referenceNodeDef)) return
      const descentants = Survey.getDescendants({ nodeDef: referenceNodeDef })(survey)
      const descendantEntities = descentants
        .filter(NodeDef.isEntity)
        .filter((_nodeDef) => NodeDef.isMultiple(_nodeDef) || NodeDef.isRoot(_nodeDef))

      let _baseUnitNodeDefsToCreate = [] // store nodeDefs to trigger to the backend
      const chainUuid = Chain.getUuid(chain)

      descendantEntities.forEach((nodeDef) => {
        const name = NodeDef.isEqual(nodeDef)(referenceNodeDef)
          ? `weight`
          : `${NodeDef.getName(nodeDef)}__${NodeDef.getName(referenceNodeDef)}_area`
        const props = {
          [NodeDef.propKeys.name]: name,
        }
        const defaultValue = NodeDef.isEqual(nodeDef)(referenceNodeDef) ? `1` : `NA`

        const advancedProps = {
          [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
          [NodeDef.keysPropsAdvanced.active]: true,
          [NodeDef.keysPropsAdvanced.index]: -1,
          [NodeDef.keysPropsAdvanced.isBaseUnit]: true,
          [NodeDef.keysPropsAdvanced.script]: `${NodeDef.getName(nodeDef)}$${name} <- ${defaultValue}`,
        }
        const parentNodeDef = NodeDef.isEqual(nodeDef)(referenceNodeDef) ? referenceNodeDef : nodeDef
        const temporary = true
        const virtual = false
        const _nodeDef = NodeDef.newNodeDef(
          parentNodeDef,
          NodeDef.nodeDefType.decimal,
          cycleKeys,
          props,
          advancedProps,
          temporary,
          virtual
        )
        _baseUnitNodeDefsToCreate.push(_nodeDef)
      })

      setBaseUnitNodeDefsToCreate(_baseUnitNodeDefsToCreate)
      setBaseUnitNodeDef(_baseUnitNodeDefsToCreate[0])
    },
    [setBaseUnitNodeDef, baseUnitNodeDef, survey]
  )

  useEffect(() => {
    // TODO if survey has other base unit nodedef into other chain, the user is not able to create "base unit/weight" nodedef
    const hierarchy = Survey.getHierarchy()(survey)
    let _baseUnitNodeDef = null

    // LOAD _baseUnitNodeDef
    const traverse = (nodeDef) => {
      if (NodeDef.isRoot(nodeDef) || !NodeDef.isSingleEntity(nodeDef)) {
        const nodeDefs = Survey.getAnalysisNodeDefs({ chain, entityDefUuid: NodeDef.getUuid(nodeDef) })(survey)
        const __baseUnitNodeDef = nodeDefs.find(NodeDef.isBaseUnit)
        if (!_baseUnitNodeDef && __baseUnitNodeDef) {
          _baseUnitNodeDef = __baseUnitNodeDef
        }
      }
    }

    Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

    if (_baseUnitNodeDef) {
      setBaseUnitNodeDef(_baseUnitNodeDef)
      setHadBaseUnitNodeDef(true)
    }

    return () => {
      return
    }
  }, [chain])

  if (!chain || A.isEmpty(chain)) return null

  return (
    <FormItem label={i18n.t('common.baseUnit')} className="node-def-edit__base-unit">
      <div className="node-def-edit__base-unit-selector">
        <EntitySelector
          hierarchy={Survey.getHierarchy()(survey)}
          lang={lang}
          nodeDefUuidEntity={NodeDef.getParentUuid(baseUnitNodeDef)}
          onChange={handleUpdateBaseUnit}
          showSingleEntities={false}
          disabled={hadBaseUnitNodeDef}
          useNameAsLabel={true}
          allowEmptySelection={true}
        />
        {baseUnitNodeDefsToCreate.length > 0 && (
          <div>
            <ButtonSave onClick={handleSaveBaseUnitNodeDefs} />
          </div>
        )}

        {hadBaseUnitNodeDef && (
          <div>
            <ButtonDelete onClick={handleDeleteBaseUnit} />
          </div>
        )}
      </div>
    </FormItem>
  )
}

export default BaseUnitSelector
