import path from 'path'
import * as Chain from '@common/analysis/processingChain'
import fs from 'fs'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import { checkFileAndGetContent } from './utils'

export const checkChains = async ({ surveyExtractedPath }) => {
  const chains = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'chains', 'chains.json'),
  })

  await expect(chains.length).toBe(1)

  const chainUuid = Chain.getUuid(chains[0])
  await expect(Chain.getLabel('en')(chains[0])).toBe('Chain 1')
  await expect(Chain.getDescription('en')(chains[0])).toBe('Processing description')

  await expect(fs.existsSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`))).toBeTruthy()

  const chainContent = fs.readFileSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`), 'utf8')
  const chain = JSON.parse(chainContent)

  await expect(Chain.getLabel('en')(chain)).toBe('Chain 1')
  await expect(Chain.getDescription('en')(chain)).toBe('Processing description')

  const processingSteps = Chain.getProcessingSteps(chain)
  await expect(processingSteps.length).toBe(1)

  await expect(Step.getProcessingChainUuid(processingSteps[0])).toBe(chainUuid)
  const calculations = Step.getCalculations(processingSteps[0])
  await expect(calculations.length).toBe(1)
  const calculation = calculations[0]
  await expect(Calculation.getProcessingStepUuid(calculation)).toBe(Step.getUuid(processingSteps[0]))
  await expect(Calculation.getLabel('en')(calculation)).toBe('Tree volume')
}
