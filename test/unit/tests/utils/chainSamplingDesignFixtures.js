import { SurveyFactory, NodeDefFactory, CategoryFactory } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

// Builds a minimal survey with a "plot" entity (potential chain base unit), keyed by a single
// attribute whose type/category can be tuned to exercise the sampling-point-data join detection.
// Both a sampling_point_data category and an unrelated "other" category are always created (and
// their uuids returned) so callers can independently control the base unit's key category and
// the Phase-1 category, since the join method requires both to be sampling_point_data.
export const buildSurveyWithBaseUnit = ({ baseUnitKeyIsSamplingPointData, baseUnitKeyIsCode = true }) => {
  let survey = SurveyFactory.createInstance({ name: 'test_survey' })

  const samplingPointDataCategory = CategoryFactory.createInstance({
    props: { name: Category.samplingPointDataCategoryName },
  })
  const otherCategory = CategoryFactory.createInstance({ props: { name: 'other_category' } })
  survey = {
    ...survey,
    categories: { [samplingPointDataCategory.uuid]: samplingPointDataCategory, [otherCategory.uuid]: otherCategory },
  }

  const root = NodeDefFactory.createInstance({ type: NodeDef.nodeDefType.entity, props: { name: 'root' } })
  survey = Survey.assocNodeDef({ nodeDef: root })(survey)

  const plot = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.entity,
    nodeDefParent: root,
    props: { name: 'plot', multiple: true },
  })
  survey = Survey.assocNodeDef({ nodeDef: plot })(survey)

  const keyCategory = baseUnitKeyIsSamplingPointData ? samplingPointDataCategory : otherCategory
  const plotId = NodeDefFactory.createInstance({
    type: baseUnitKeyIsCode ? NodeDef.nodeDefType.code : NodeDef.nodeDefType.text,
    nodeDefParent: plot,
    // categoryUuid is set even for the non-code case, so the "not a code attribute" test
    // isolates the isCode guard rather than accidentally testing category mismatch too.
    props: { name: 'plot_id', key: true, categoryUuid: keyCategory.uuid },
  })
  survey = Survey.assocNodeDef({ nodeDef: plotId })(survey)

  return {
    survey,
    baseUnitNodeDef: plot,
    samplingPointDataCategoryUuid: samplingPointDataCategory.uuid,
    otherCategoryUuid: otherCategory.uuid,
  }
}
