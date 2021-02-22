import path from 'path'
import fs from 'fs'

import { checkFileAndGetContent } from './utils'

export const checkChain = async ({ surveyExtractedPath, chainUuid }) => {
  const chainContent = fs.readFileSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`), 'utf8')
  const chain = JSON.parse(chainContent)

  const { props: chainProps, processingSteps } = chain
  const { labels, descriptions } = chainProps

  await expect(labels.en).toBe('Chain 1')
  await expect(descriptions.en).toBe('Processing description')

  await expect(processingSteps.length).toBe(1)

  const { processing_chain_uuid: processingChainUuid, calculations, uuid } = processingSteps[0]
  await expect(processingChainUuid).toBe(chainUuid)
  await expect(calculations.length).toBe(1)
  const { props: calculationProps, processing_step_uuid: processingStepUuid } = calculations[0]
  await expect(processingStepUuid).toBe(uuid)
  await expect(calculationProps.labels.en).toBe('Tree volume')
}

export const checkChains = async ({ surveyExtractedPath }) => {
  const chains = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'chains', 'chains.json'),
  })

  await expect(chains.length).toBe(1)

  const { uuid: chainUuid, props: chainProps } = chains[0]
  const { labels, descriptions } = chainProps
  await expect(labels.en).toBe('Chain 1')
  await expect(descriptions.en).toBe('Processing description')

  await expect(fs.existsSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`))).toBeTruthy()

  await checkChain({ surveyExtractedPath, chainUuid })
}
