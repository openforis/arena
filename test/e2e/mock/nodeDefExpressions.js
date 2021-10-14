import { TestId } from '../../../webapp/utils/testId'

export const nodeDefExpressions = {
  cluster_date: [
    {
      type: TestId.nodeDefDetails.defaultValues,
      expression: 'now()',
    },
  ],
  cluster_time: [
    {
      type: TestId.nodeDefDetails.defaultValues,
      expression: 'now()',
    },
  ],
  cluster_country: [
    {
      type: TestId.nodeDefDetails.defaultValues,
      expression: '0',
    },
  ],
  cluster_boolean: [
    {
      type: TestId.nodeDefDetails.defaultValues,
      expression: 'True',
    },
  ],
  plot: [
    {
      type: TestId.nodeDefDetails.relevantIf,
      expression: 'cluster_id > 0',
    },
  ],
  tree_dec_1: [
    {
      type: TestId.nodeDefDetails.validations,
      expression: 'tree_dec_1 > 0',
    },
  ],
  tree_dec_2: [
    {
      type: TestId.nodeDefDetails.validations,
      expression: 'tree_dec_2 > 0',
      applyIf: 'tree_dec_1 > 10',
    },
    {
      type: TestId.nodeDefDetails.validations,
      expression: 'tree_dec_2 > 10',
    },
  ],
  tree_species: [
    {
      type: TestId.nodeDefDetails.defaultValues,
      expression: 'ALB/GLA',
    },
  ],
}
