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
import validationReport from '../tests/validationReport'

import userInvite from '../tests/userInvite'

import surveyDelete from '../tests/surveyDelete'

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
  userInvite()

  /**
   * Validation Report.
   */
  validationReport()

  /**
   * Delete.
   */
  surveyDelete()
})
