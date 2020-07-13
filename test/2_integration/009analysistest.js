import * as SimpleProcessingChainTest from './analysisTest/simpleProcessingChainTest'
import * as ComplexProcessingChainTest from './analysisTest/complexProcessingChainTest'

export const ProcessingchainTest = async () => {
  describe('Processing chains test', () => {
    test('Simple processing chain test', SimpleProcessingChainTest.simpleTest)

    test('Processing chain result views test', ComplexProcessingChainTest.chainWithSimpleEntityTest)

    test(
      'Processing chain with virtual entity result views test',
      ComplexProcessingChainTest.chainWithVirtualEntityTest
    )
  })
}
