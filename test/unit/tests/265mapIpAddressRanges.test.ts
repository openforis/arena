import {
  getIpFamily,
  isPublicIpAddress,
  parseIpv4,
  parseIpv6,
} from '@server/modules/geo/service/mapCapabilities/ipAddressRanges'

describe('map capabilities IP address ranges (265)', () => {
  test('parses dotted-decimal IPv4 addresses strictly', () => {
    expect(parseIpv4('192.168.1.20')).toEqual([192, 168, 1, 20])
    expect(parseIpv4('256.1.1.1')).toBeNull()
    expect(parseIpv4('1.2.3')).toBeNull()
    expect(parseIpv4('01.2.3.4')).toBeNull()
    expect(parseIpv4('0x7f.0.0.1')).toBeNull()
  })

  test('parses IPv6 addresses: compressed, bracketed, with an IPv4 tail or a zone id', () => {
    expect(parseIpv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1])
    expect(parseIpv6('::')).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(parseIpv6('[2001:db8::8a2e:370:7334]')).toEqual([0x2001, 0xdb8, 0, 0, 0, 0x8a2e, 0x370, 0x7334])
    expect(parseIpv6('::ffff:127.0.0.1')).toEqual([0, 0, 0, 0, 0, 0xffff, 0x7f00, 1])
    expect(parseIpv6('fe80::1%eth0')).toEqual([0xfe80, 0, 0, 0, 0, 0, 0, 1])
    expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull()
    expect(parseIpv6('1::2::3')).toBeNull()
    expect(parseIpv6('12345::1')).toBeNull()
    expect(parseIpv6('example.org')).toBeNull()
  })

  test('tells the IP family of a host', () => {
    expect(getIpFamily('8.8.8.8')).toBe(4)
    expect(getIpFamily('[::1]')).toBe(6)
    expect(getIpFamily('example.org')).toBe(0)
  })

  test.each([
    '8.8.8.8',
    '1.1.1.1',
    '172.32.0.1',
    '100.128.0.1',
    '192.169.0.1',
    '2606:4700:4700::1111',
    '2a00:1450:4001:80b::200e',
    '::ffff:8.8.8.8',
    '64:ff9b::808:808',
    '2001:30::1',
    '3fff:1000::1',
  ])('accepts the public address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(true)
  })

  test.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '127.255.255.254',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '198.51.100.7',
    '203.0.113.9',
    '224.0.0.251',
    '239.255.255.250',
    '255.255.255.255',
    '::',
    '::1',
    '[::1]',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.1',
    '64:ff9b::a00:1',
    '64:ff9b:1::1',
    '::a00:1',
    '100::1',
    '2001::1',
    '2001:db8::1',
    '::ffff:0:0:1',
    '2001:2::1',
    '2001:10::1',
    '2001:1f:ffff::1',
    '2001:20::1',
    '2001:2f:ffff::1',
    '3fff::1',
    '3fff:fff:ffff::1',
    '2002:c0a8:101::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'fe80::1%eth0',
    'fec0::1',
    'ff02::1',
  ])('refuses the non-public address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  test.each(['', 'localhost', 'example.org', '1.2.3', '1::2::3'])('refuses %p, which is not an IP address', (value) => {
    expect(isPublicIpAddress(value)).toBe(false)
  })
})
