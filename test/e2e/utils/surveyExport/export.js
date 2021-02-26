/*
 * @jest-environment node
 */

import axios from 'axios'
import fs from 'fs'
import { click, expectExists, intercept, toLeftOf } from '../api'

// https://stackoverflow.com/questions/42677387/jest-returns-network-error-when-doing-an-authenticated-request-with-axios
axios.defaults.adapter = require('axios/lib/adapters/http')

const fetchAndSaveSurvey = async ({
  request = { request: { request: { url: 'http://localhost:9090/api/survey/1/export' } } },
  zipFilePath,
}) => {
  const responseAuth = await axios.post(`${request.request.url.split('api')[0]}auth/login`, {
    email: 'test@arena.com',
    password: 'test',
  })
  const { headers } = responseAuth

  const response = await axios({
    url: request.request.url,
    method: 'GET',
    responseType: 'arraybuffer',
    headers: {
      Cookie: headers['set-cookie'],
    },
  })

  fs.writeFileSync(zipFilePath, response.data)

  await expect(zipFilePath).toBeTruthy()
  await expect(fs.existsSync(zipFilePath)).toBeTruthy()
  request.continue({})
}

export const exportSurvey = async ({ zipFilePath }) => {
  await intercept(new RegExp(/export/), async (request) => fetchAndSaveSurvey({ request, zipFilePath }))

  await expectExists({ text: 'Export' })
  await click('Export', toLeftOf('Delete'))
}
