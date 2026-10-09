import {
  getLocalServerHostingClass,
  getTargetAddressSpace,
  isLoopbackHost,
  parseIpv4,
  parseIpv6,
} from '@common/ai/localServerAddress'

const allowlist = ['http://10.0.0.5:8000/v1', 'https://llm.internal.example/v1', 'http://localhost:1234/v1']

describe('getLocalServerHostingClass', () => {
  test.each([
    'http://localhost:1234/v1',
    'http://LOCALHOST:1234/v1/',
    'http://localhost./v1',
    'https://localhost/v1',
    'http://lmstudio.localhost:1234/v1',
    'http://127.0.0.1:1234/v1',
    'http://127.255.255.254/v1',
    'http://127.1/v1',
    'http://2130706433/v1',
    'http://0x7f000001/v1',
    'http://[::1]:1234/v1',
    'http://[0:0:0:0:0:0:0:1]/v1',
    'http://[::ffff:127.0.0.1]/v1',
  ])('%s is on this device', (url) => {
    expect(getLocalServerHostingClass(url, [])).toBe('onDevice')
    // loopback wins over the allowlist
    expect(getLocalServerHostingClass(url, allowlist)).toBe('onDevice')
  })

  test.each([
    'http://10.0.0.5:8000/v1',
    'http://10.0.0.5:8000/v1/',
    'http://10.0.0.5:8000/v1/chat/completions',
    'https://llm.internal.example/v1',
    'https://LLM.Internal.Example/v1',
  ])('%s is organisation-hosted when allowlisted', (url) => {
    expect(getLocalServerHostingClass(url, allowlist)).toBe('orgHosted')
    expect(getLocalServerHostingClass(url, [])).toBe('cloud')
  })

  test.each([
    'http://localhost.example.com/v1',
    'http://127.0.0.1.nip.io/v1',
    'http://10.0.0.5:8001/v1',
    'http://10.0.0.5:8000/v10',
    'http://192.168.1.20:1234/v1',
    'http://172.16.0.1/v1',
    'http://169.254.1.1/v1',
    'http://100.64.0.1/v1',
    'http://0.0.0.0:1234/v1',
    'http://[fd00::1]/v1',
    'http://[fe80::1]/v1',
    'http://[::ffff:10.0.0.5]/v1',
    'http://[::2]/v1',
    'http://[::]:1234',
    'http://[::127.0.0.1]:1234',
    'http://localhost.example.com',
    'http://127.0.0.1.nip.io',
    'http://studio.local:1234/v1',
    'https://api.example.com/v1',
    'ftp://localhost/v1',
    'localhost:1234',
    'not a url',
    '',
  ])('%s is cloud', (url) => {
    expect(getLocalServerHostingClass(url, allowlist)).toBe('cloud')
  })

  test('a non-string value is cloud', () => {
    expect(getLocalServerHostingClass(undefined as unknown as string, allowlist)).toBe('cloud')
  })
})

describe('getTargetAddressSpace', () => {
  test.each([
    'http://192.168.1.20:1234/v1',
    'https://192.168.1.20:1234/v1',
    'http://10.1.2.3/v1',
    'http://172.16.0.1/v1',
    'http://172.31.255.255/v1',
    'http://100.64.0.1/v1',
    'http://169.254.0.1/v1',
    'http://[fd12::1]/v1',
    'http://[fe80::1]/v1',
    'http://[::ffff:192.168.0.1]/v1',
    'http://studio.local:1234/v1',
  ])('%s → local', (url) => {
    expect(getTargetAddressSpace(url)).toBe('local')
  })

  test.each([
    'http://172.32.0.1/v1',
    'http://172.15.255.255/v1',
    'http://100.128.0.1/v1',
    'http://localhost:1234/v1',
    'http://127.0.0.1/v1',
    'http://[::1]/v1',
    'https://api.example.com/v1',
    'ftp://192.168.1.20/v1',
    'not a url',
  ])('%s → null', (url) => {
    expect(getTargetAddressSpace(url)).toBeNull()
  })
})

describe('address parsing', () => {
  test('parseIpv4 accepts only dotted quads', () => {
    expect(parseIpv4('127.0.0.1')).toEqual([127, 0, 0, 1])
    expect(parseIpv4('256.0.0.1')).toBeNull()
    expect(parseIpv4('1.2.3')).toBeNull()
    expect(parseIpv4('localhost')).toBeNull()
    expect(parseIpv4('01.2.3.4')).toBeNull()
  })

  test('parseIpv6 expands ::', () => {
    expect(parseIpv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1])
    expect(parseIpv6('fe80::1')).toEqual([0xfe80, 0, 0, 0, 0, 0, 0, 1])
    expect(parseIpv6('1:2:3:4:5:6:7:8')).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(parseIpv6('1::2::3')).toBeNull()
    expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull()
    expect(parseIpv6('12345::1')).toBeNull()
    expect(parseIpv6('localhost')).toBeNull()
  })

  test('isLoopbackHost reads URL hostnames (IPv6 with brackets)', () => {
    expect(isLoopbackHost('[::1]')).toBe(true)
    expect(isLoopbackHost('[::ffff:7f00:1]')).toBe(true)
    expect(isLoopbackHost('a.b.localhost')).toBe(true)
    expect(isLoopbackHost('localhostx')).toBe(false)
  })
})
