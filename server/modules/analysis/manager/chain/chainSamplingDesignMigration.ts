import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { TableChain } from '@common/model/db'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as DB from '@server/db'

import * as ChainRepository from '../../repository/chain'

const oldSamplingDesignPhasePropKeys = {
  firstPhaseCategoryUuid: 'firstPhaseCategoryUuid',
  firstPhaseCategoryExtraProp: 'firstPhaseCategoryExtraProp',
  firstPhaseCommonAttributeUuid: 'firstPhaseCommonAttributeUuid',
}

/**
 * Determines whether the given entity node def can be selected as phase 2 join entity.
 * Mirrors the filter used by the Phase2JoinEntitySelector component in the webapp: only the root
 * entity, the base unit entity itself, or one of the base unit's ancestors are selectable.
 */
const _isSelectableAsPhase2JoinEntity = ({ nodeDef, baseUnitNodeDef }: { nodeDef: any; baseUnitNodeDef?: any }) =>
  NodeDef.isRoot(nodeDef) ||
  (Boolean(baseUnitNodeDef) &&
    (NodeDef.getUuid(nodeDef) === NodeDef.getUuid(baseUnitNodeDef) || NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef)))

/**
 * Finds the closest ancestor entity (starting from the attribute's own parent entity) that would be
 * accepted by the phase 2 join entity selector. Walking up is necessary because the old "common
 * attribute" selector allowed attributes nested in single entities below the base unit (or below one
 * of its ancestors): those immediate parent entities are not selectable in the new selector, and
 * would be silently discarded (together with the join attribute) as soon as the page is rendered.
 */
const _findPhase2JoinEntity = ({
  attributeNodeDef,
  baseUnitNodeDef,
  survey,
}: {
  attributeNodeDef: any
  baseUnitNodeDef?: any
  survey: any
}): any => {
  let candidate = Survey.getNodeDefParent(attributeNodeDef)(survey)
  while (candidate) {
    if (_isSelectableAsPhase2JoinEntity({ nodeDef: candidate, baseUnitNodeDef })) return candidate
    candidate = Survey.getNodeDefParent(candidate)(survey)
  }
  return null
}

const _migrateSamplingDesignPhaseProps = ({
  samplingDesign,
  survey,
}: {
  samplingDesign: Record<string, any>
  survey: any
}): Record<string, any> => {
  const migrated = { ...samplingDesign }

  if (oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid in migrated) {
    migrated[ChainSamplingDesign.keysProps.phase1CategoryUuid] =
      migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid]
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryUuid]
  }
  if (oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp in migrated) {
    migrated[ChainSamplingDesign.keysProps.phase1JoinAttribute] =
      migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp]
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCategoryExtraProp]
  }
  if (oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid in migrated) {
    const attributeUuid = migrated[oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid]
    migrated[ChainSamplingDesign.keysProps.phase2JoinAttribute] = attributeUuid
    delete migrated[oldSamplingDesignPhasePropKeys.firstPhaseCommonAttributeUuid]

    const attributeNodeDef = Survey.getNodeDefByUuid(attributeUuid)(survey)
    // base unit node def uuid is not touched by this migration: read it from the original sampling design
    // (cast needed: TS's inference of this Ramda-backed getter from the untyped JS module resolves to `{}`)
    const baseUnitNodeDefUuid = (ChainSamplingDesign.getBaseUnitNodeDefUuid as (samplingDesign: any) => string)(
      samplingDesign
    )
    const baseUnitNodeDef = baseUnitNodeDefUuid ? Survey.getNodeDefByUuid(baseUnitNodeDefUuid)(survey) : null
    const joinEntity = attributeNodeDef ? _findPhase2JoinEntity({ attributeNodeDef, baseUnitNodeDef, survey }) : null
    if (joinEntity) {
      migrated[ChainSamplingDesign.keysProps.phase2JoinEntityUuid] = NodeDef.getUuid(joinEntity)
    }
    migrated[ChainSamplingDesign.keysProps.phase2AsSamplingPointData] = false
  }

  return migrated
}

/**
 * Migrates every chain in the given survey from the old sampling design phase prop names
 * (firstPhaseCategoryUuid, firstPhaseCategoryExtraProp, firstPhaseCommonAttributeUuid) to the
 * current ones (phase1CategoryUuid, phase1JoinAttribute, phase2JoinAttribute), backfilling
 * phase2JoinEntityUuid with the closest ancestor entity of the previously selected common attribute
 * that is also selectable in the new phase 2 join entity selector.
 * Chains without any of the old keys are left untouched.
 */
export const migrateSamplingDesignPhaseProps = async (
  { surveyId }: { surveyId: number },
  client: any = DB.client
): Promise<void> => {
  const chains = await ChainRepository.fetchChains({ surveyId }, client)

  const chainsToMigrate = chains.filter((chain: any) => {
    const samplingDesign = Chain.getSamplingDesign(chain)
    return Object.values(oldSamplingDesignPhasePropKeys).some((oldKey) => oldKey in samplingDesign)
  })
  if (chainsToMigrate.length === 0) return

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeAnalysis: true },
    client
  )

  for (const chain of chainsToMigrate as any[]) {
    const samplingDesign = Chain.getSamplingDesign(chain)
    const migratedSamplingDesign = _migrateSamplingDesignPhaseProps({ samplingDesign, survey })
    await ChainRepository.updateChain(
      {
        surveyId,
        chainUuid: Chain.getUuid(chain),
        fields: { [TableChain.columnSet.props]: { [Chain.keysProps.samplingDesign]: migratedSamplingDesign } },
      },
      client
    )
  }
}
