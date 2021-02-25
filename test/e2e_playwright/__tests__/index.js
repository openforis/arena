import login from '../tests/login'

import surveyCreate from '../tests/surveyCreate'
import surveyInfoEdit from '../tests/surveyInfoEdit'

import nodeDefAtomicEdit from '../tests/nodeDefAtomicEdit'
import nodeDefCodeAndCategoryEdit from '../tests/nodeDefCodeAndCategoryEdit'
import nodeDefTaxonAndTaxonomyEdit from '../tests/nodeDefTaxonAndTaxonomyEdit'
import nodeDefExpressionsEdit from '../tests/nodeDefExpressionsEdit'

import surveyDelete from '../tests/surveyDelete'
import nodeDefReorder from '../tests/nodeDefReorder'
import surveyFormPreview from '../tests/surveyFormPreview'
// import recordAdd from '../tests/recordAdd'

beforeAll(async () => {
  await page.goto('http://localhost:9090')
})

describe('E2E Tests', () => {
  login()
  /**
   * Survey create and info edit.
   */
  surveyCreate()
  surveyInfoEdit()
  /**
   * Designer.
   */
  nodeDefAtomicEdit()
  nodeDefCodeAndCategoryEdit()
  nodeDefTaxonAndTaxonomyEdit()
  nodeDefReorder()
  nodeDefExpressionsEdit()
  surveyFormPreview()
  // /**
  //  * Data.
  //  */
  // recordAdd()
  /**
   * Survey delete.
   */
  surveyDelete()
})
