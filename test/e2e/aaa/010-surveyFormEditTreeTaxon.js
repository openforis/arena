import { addNodeDefToTable, clickNodeDefSaveAndBack, clickNodeDefTaxonomyAdd } from '../utils/ui/nodeDefDetail'
import { expectSurveyFormItemNames } from '../utils/ui/surveyForm'
import { clickTaxonomyButtonClose, writeTaxonomyName } from '../utils/ui/taxonomyDetails'
import { treeSpeciesNodeDef } from '../resources/nodeDefs/nodeDefs'

const taxonomyName = 'tree_species'

describe('SurveyForm edit: Tree taxon', () => {
  test('Tree: add taxon attribute "tree_species"', async () => {
    await addNodeDefToTable({
      ...treeSpeciesNodeDef,
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
