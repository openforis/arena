import * as NodeDef from '@core/survey/nodeDef'

import { addNodeDefToTable, clickNodeDefSaveAndBack, clickNodeDefTaxonomyAdd } from '../utils/ui/nodeDefDetail'
import { expectSurveyFormItemNames } from '../utils/ui/surveyForm'
import { clickTaxonomyButtonClose, writeTaxonomyName } from '../utils/ui/taxonomyDetails'

const taxonomyName = 'tree_species'

describe('SurveyForm edit: Tree taxon', () => {
  test('Tree: add taxon attribute "tree_species"', async () => {
    await addNodeDefToTable({
      type: NodeDef.nodeDefType.taxon,
      name: 'tree_species',
      label: 'Tree Species',
      saveAndBack: false,
    })

    await clickNodeDefTaxonomyAdd()

    // start of taxonomy edit
    await writeTaxonomyName({ text: taxonomyName })
    await clickTaxonomyButtonClose()
    // end of taxonomy edit

    await clickNodeDefSaveAndBack()

    await expectSurveyFormItemNames({
      entityName: 'tree',
      itemNames: ['tree_id', 'tree_dec_1', 'tree_dec_2', 'tree_species'],
    })
  }, 30000)
})
