import * as SimpleProcessingChainTest from './analysisTest/simpleProcessingChainTest'
import * as ComplexProcessingChainTest from './analysisTest/complexProcessingChainTest'

describe('Processing chains test', () => {
  it('Simple processing chain test', SimpleProcessingChainTest.simpleTest)

  it('Processing chain result views test', ComplexProcessingChainTest.chainWithSimpleEntityTest)

  it('Processing chain with virtual entity result views test', ComplexProcessingChainTest.chainWithVirtualEntityTest)
})
