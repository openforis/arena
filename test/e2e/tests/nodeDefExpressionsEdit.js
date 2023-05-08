import { expect, test } from '@playwright/test'

import { cluster, plot, tree } from '../mock/nodeDefs'
import { nodeDefExpressions } from '../mock/nodeDefExpressions'
import { editNodeDef, gotoFormPage } from './_formDesigner'
import { gotoFormDesigner } from './_navigation'
import { editNodeDefExpression } from './_nodeDefDetails'
import { publishWithoutErrors } from './_publish'

// eslint-disable-next-line camelcase
const { cluster_date, cluster_time, cluster_boolean, cluster_country } = cluster.children
// eslint-disable-next-line camelcase
const { tree_dec_1, tree_dec_2, tree_species } = tree.children

const editExpression = (nodeDef) => {
  editNodeDef(nodeDef.name, nodeDef, false)
  editNodeDefExpression(nodeDef, nodeDefExpressions[nodeDef.name])
}

export default () =>
  test.describe('NodeDef expressions edit', () => {
    gotoFormDesigner()

    editExpression(cluster_date)
    editExpression(cluster_time)
    editExpression(cluster_boolean)
    editExpression(cluster_country)

    gotoFormPage(plot)

    editExpression(plot)
    editExpression(tree_dec_1)
    editExpression(tree_dec_2)
    editExpression(tree_species)

    publishWithoutErrors()
  })
