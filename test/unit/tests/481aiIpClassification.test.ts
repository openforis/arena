import { classifyIpAddress, type IpAddressClass } from '@common/ai/ipAddress'
import { isLoopbackHost, isPrivateHost } from '@common/ai/localServerAddress'
import { isBlockedAddress } from '@server/modules/ai/service/baseUrlGuard'

// one table for both callers: the server blocks every address that is not public, the browser tells loopback and the
// local network (private) from the rest
const cases: [string, IpAddressClass][] = [
  ['8.8.8.8', 'public'],
  ['172.32.0.1', 'public'],
  ['172.15.255.255', 'public'],
  ['100.128.0.1', 'public'],
  ['2606:4700::1111', 'public'],
  ['::ffff:8.8.8.8', 'public'],
  ['::ffff:808:808', 'public'],
  ['0.0.0.0', 'unspecified'],
  ['0.1.2.3', 'unspecified'],
  ['::', 'unspecified'],
  ['127.0.0.1', 'loopback'],
  ['127.255.255.255', 'loopback'],
  ['::1', 'loopback'],
  ['0:0:0:0:0:0:0:1', 'loopback'],
  ['::ffff:127.0.0.1', 'loopback'],
  ['::ffff:7f00:1', 'loopback'],
  ['0:0:0:0:0:ffff:7f00:1', 'loopback'],
  ['10.0.0.1', 'private'],
  ['172.16.0.1', 'private'],
  ['172.31.255.255', 'private'],
  ['192.168.1.1', 'private'],
  ['169.254.169.254', 'private'],
  ['100.64.0.1', 'private'],
  ['100.127.255.255', 'private'],
  ['fc00::1', 'private'],
  ['fd12:3456::1', 'private'],
  ['fe80::1', 'private'],
  ['fe80::1%eth0', 'private'],
  ['fec0::1', 'private'],
  ['::ffff:10.0.0.1', 'private'],
  ['::ffff:a9fe:a9fe', 'private'],
  ['192.0.0.1', 'reserved'],
  ['198.18.0.1', 'reserved'],
  ['224.0.0.1', 'reserved'],
  ['255.255.255.255', 'reserved'],
  ['::2', 'reserved'],
  ['64:ff9b::7f00:1', 'reserved'],
  ['64:ff9b:1::1', 'reserved'],
  ['2002:7f00:1::', 'reserved'],
  ['2001::1', 'reserved'],
  ['::ffff:0:7f00:1', 'reserved'],
  ['ff02::1', 'reserved'],
  ['not an address', 'invalid'],
  ['256.1.1.1', 'invalid'],
  ['1.2.3', 'invalid'],
  ['01.2.3.4', 'invalid'],
  ['1::2::3', 'invalid'],
  ['', 'invalid'],
]

describe('one IP classification for the server guard and the browser (481)', () => {
  test.each(cases)('%s is %s', (address, expected) => {
    expect(classifyIpAddress(address)).toBe(expected)
  })

  test.each(cases)('the server guard blocks %s only when it is not public (%s)', (address, ipClass) => {
    expect(isBlockedAddress(address)).toBe(ipClass !== 'public')
  })

  test.each(cases.filter(([address]) => !address.includes('%') && address !== '' && !address.includes(' ')))(
    'the browser reads %s as loopback or private like the classification (%s)',
    (address, ipClass) => {
      const host = address.includes(':') ? `[${address}]` : address
      expect(isLoopbackHost(host)).toBe(ipClass === 'loopback')
      expect(isPrivateHost(host)).toBe(ipClass === 'private')
    }
  )

  test('the names that mean this device or the local network stay with the browser', () => {
    expect(isLoopbackHost('localhost')).toBe(true)
    expect(isLoopbackHost('app.localhost')).toBe(true)
    expect(isPrivateHost('printer.local')).toBe(true)
    expect(isPrivateHost('example.org')).toBe(false)
  })
})
