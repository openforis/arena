import { ChildProcess, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// oauth2-mock-server is ESM only: it runs in a child process; the claims of the next ID tokens are read from a file
const serverScript = `
import fs from 'node:fs'
import { OAuth2Server } from 'oauth2-mock-server'
const server = new OAuth2Server()
await server.issuer.keys.generate('RS256')
server.service.on('beforeTokenSigning', (token) => {
  Object.assign(token.payload, JSON.parse(fs.readFileSync(process.env.CLAIMS_FILE, 'utf8')))
})
await server.start(0, 'localhost')
console.log('MOCK_OIDC_URL=' + server.issuer.url)
`

/**
 * OpenID Connect provider for the tests: it signs in immediately (no login page) with the configured claims.
 */
export class MockOidcProvider {
  private process?: ChildProcess
  private readonly claimsFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mock-oidc-')), 'claims.json')
  issuer = ''

  async start(): Promise<void> {
    this.setClaims({ sub: 'default' })
    this.process = spawn(process.execPath, ['--input-type=module', '-e', serverScript], {
      cwd: process.cwd(),
      env: { ...process.env, CLAIMS_FILE: this.claimsFile, NODE_OPTIONS: '' },
    })
    this.issuer = await new Promise<string>((resolve, reject) => {
      let output = ''
      this.process!.stdout!.on('data', (data) => {
        output += data.toString()
        const match = /MOCK_OIDC_URL=(\S+)/.exec(output)
        if (match) resolve(match[1])
      })
      this.process!.stderr!.on('data', (data) => (output += data.toString()))
      this.process!.on('exit', (code) => reject(new Error(`mock OIDC provider exited (${code}): ${output}`)))
    })
  }

  setClaims(claims: Record<string, unknown>): void {
    fs.writeFileSync(this.claimsFile, JSON.stringify(claims))
  }

  stop(): void {
    this.process?.kill()
  }
}
