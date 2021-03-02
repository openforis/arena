import { BASE_URL } from '../config'

import login from '../tests/login'

import surveyCreate from '../tests/surveyCreate'
import surveyInfoEdit from '../tests/surveyInfoEdit'

import nodeDefAtomicEdit from '../tests/nodeDefAtomicEdit'
import nodeDefCodeAndCategoryEdit from '../tests/nodeDefCodeAndCategoryEdit'
import nodeDefTaxonAndTaxonomyEdit from '../tests/nodeDefTaxonAndTaxonomyEdit'
import nodeDefReorder from '../tests/nodeDefReorder'
import nodeDefExpressionsEdit from '../tests/nodeDefExpressionsEdit'
import surveyFormPreview from '../tests/surveyFormPreview'

import recordAdd from '../tests/recordAdd'
// import recordVerify from '../tests/recordVerify'

// import userInvite from '../tests/userInvite'
// import recordDelete from '../tests/recordDelete'

import surveyExport from '../tests/surveyExport'

import validationReport from '../tests/validationReport'
// import recordDelete from '../tests/recordDelete'
import surveyDelete from '../tests/surveyDelete'

beforeAll(async () => {
  await page.goto(BASE_URL)
})

describe('E2E Tests', () => {
  login()
  /**
   * Survey create and info edit.
   */
  surveyCreate()
  surveyInfoEdit()

  /**
   * Node def edit.
   */
  nodeDefAtomicEdit()
  nodeDefCodeAndCategoryEdit()
  nodeDefTaxonAndTaxonomyEdit()
  nodeDefReorder()
  nodeDefExpressionsEdit()
  surveyFormPreview()

  /**
   * Data edit.
   */
  recordAdd()
  // TODO: Fix tree order and uncomment recordVerify https://github.com/openforis/arena/issues/1413
  // recordVerify()

  /**
   * User.
   */
  // TODO: Enable userInvite when implementing user delete.
  // userInvite()

  /**
   * Survey export/import/clone.
   */
  surveyExport()

  /**
   * Validation Report.
   */
  validationReport()

  // /**
  //  * Delete.
  //  */
  // recordDelete()
  surveyDelete()
})
