const NodeDependentUpdateManagerTest = require('./recordTests/nodeDependentUpdateManagerTest')

describe('NodeDependentUpdateManager Test', async () => {
  it('Calculated value updated', NodeDependentUpdateManagerTest.calculatedValueUpdateTest)
  it('Calculated value with apply if updated', NodeDependentUpdateManagerTest.calculatedValueWithApplyIfUpdateTest)
  it('Calculated value cascade update', NodeDependentUpdateManagerTest.calculatedValueCascadeUpdateTest)

  it('Apply if update', NodeDependentUpdateManagerTest.applyIfUpdateTest)
})