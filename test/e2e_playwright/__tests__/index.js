import login from '../tests/login'

import surveyCreate from '../tests/surveyCreate'
import surveyInfoEdit from '../tests/surveyInfoEdit'

import nodeDefAtomicEdit from '../tests/nodeDefAtomicEdit'
import nodeDefCodeAndCategoryEdit from '../tests/nodeDefCodeAndCategoryEdit'
import nodeDefTaxonAndTaxonomyEdit from '../tests/nodeDefTaxonAndTaxonomyEdit'
import nodeDefExpressionsEdit from '../tests/nodeDefExpressionsEdit'
import surveyFormPreview from '../tests/surveyFormPreview'

import recordAdd from '../tests/recordAdd'

import surveyInviteUser from '../tests/surveyInviteUser'

import surveyDelete from '../tests/surveyDelete'
import nodeDefReorder from '../tests/nodeDefReorder'

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
  /**
   * Survey invite user.
   */
  surveyInviteUser()
  /**
   * Survey delete.
   */
  surveyDelete()
})
