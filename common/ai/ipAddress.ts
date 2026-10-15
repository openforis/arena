/**
 * Classification of IP addresses, shared by the server (which addresses a provider endpoint may be called on) and the
 * browser (which URLs are on this device or the local network). Pure: no DNS, no Node modules, so it runs in both.
 */

export type IpAddressClass =
  // not an IP address at all
  | 'invalid'
  // "this network" (0.0.0.0/8) and ::
  | 'unspecified'
  // 127.0.0.0/8 and ::1
  | 'loopback'
  // the local network: private ranges, link-local, carrier-grade NAT, unique local and site-local
  | 'private'
  // multicast, reserved, benchmarking, protocol assignments and the transition mechanisms that embed an IPv4 address
  | 'reserved'
  // everything else
  | 'public'

const IPV4_OCTET = /^(0|[1-9]\d{0,2})$/
const IPV6_GROUP = /^[0-9a-f]{1,4}$/i

/**
 * Parses a dotted-quad IPv4 address (the form the URL parser produces).
 * @param {string} host - Host.
 * @returns {number[]|null} The 4 octets, or null.
 */
export const parseIpv4 = (host: string): number[] | null => {
  const parts = host.split('.')
  if (parts.length !== 4 || !parts.every((part) => IPV4_OCTET.test(part))) return null
  const octets = parts.map(Number)
  return octets.every((octet) => octet <= 255) ? octets : null
}

const parseIpv6Groups = (part: string): number[] | null => {
  if (part === '') return []
  const groups: number[] = []
  for (const group of part.split(':')) {
    if (!IPV6_GROUP.test(group)) return null
    groups.push(Number.parseInt(group, 16))
  }
  return groups
}

// ::ffff:1.2.3.4 ends with a dotted quad, which stands for the last two groups
const replaceDottedTail = (host: string): string | null => {
  const split = host.lastIndexOf(':')
  const octets = parseIpv4(host.slice(split + 1))
  if (!octets) return null
  const toGroup = (high: number, low: number) => ((high << 8) | low).toString(16)
  return `${host.slice(0, split + 1)}${toGroup(octets[0], octets[1])}:${toGroup(octets[2], octets[3])}`
}

/**
 * Parses an IPv6 address in hexadecimal groups, with at most one "::" and an optional dotted IPv4 tail (the URL parser's
 * form, without brackets).
 * @param {string} host - Host.
 * @returns {number[]|null} The 8 groups, or null.
 */
export const parseIpv6 = (host: string): number[] | null => {
  if (!host.includes(':')) return null
  const text = host.includes('.') ? replaceDottedTail(host) : host
  if (text === null) return null
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = parseIpv6Groups(halves[0])
  const tail = halves.length === 2 ? parseIpv6Groups(halves[1]) : []
  if (!head || !tail) return null
  if (halves.length === 1) return head.length === 8 ? head : null
  const missing = 8 - head.length - tail.length
  if (missing < 1) return null
  return [...head, ...new Array<number>(missing).fill(0), ...tail]
}

type Range = { network: number[]; prefix: number; ipClass: IpAddressClass }

const toGroups = (octets: number[]): number[] => [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]]

const ipv4Range = (network: string, prefix: number, ipClass: IpAddressClass): Range => ({
  network: toGroups(parseIpv4(network) as number[]),
  prefix,
  ipClass,
})

const ipv6Range = (network: string, prefix: number, ipClass: IpAddressClass): Range => ({
  network: parseIpv6(network) as number[],
  prefix,
  ipClass,
})

// the first range that matches wins: the narrow ranges come before the ones that contain them
const IPV4_RANGES: Range[] = [
  ipv4Range('0.0.0.0', 8, 'unspecified'),
  ipv4Range('10.0.0.0', 8, 'private'),
  ipv4Range('100.64.0.0', 10, 'private'), // carrier-grade NAT
  ipv4Range('127.0.0.0', 8, 'loopback'),
  ipv4Range('169.254.0.0', 16, 'private'), // link-local (cloud metadata)
  ipv4Range('172.16.0.0', 12, 'private'),
  ipv4Range('192.0.0.0', 24, 'reserved'), // IETF protocol assignments
  ipv4Range('192.168.0.0', 16, 'private'),
  ipv4Range('198.18.0.0', 15, 'reserved'), // benchmarking
  ipv4Range('224.0.0.0', 4, 'reserved'), // multicast
  ipv4Range('240.0.0.0', 4, 'reserved'), // reserved and broadcast
]

const IPV6_RANGES: Range[] = [
  ipv6Range('::', 128, 'unspecified'),
  ipv6Range('::1', 128, 'loopback'),
  ipv6Range('::', 96, 'reserved'), // IPv4-compatible
  ipv6Range('64:ff9b::', 96, 'reserved'), // NAT64 (can reach internal IPv4)
  ipv6Range('64:ff9b:1::', 48, 'reserved'), // local-use NAT64
  ipv6Range('2002::', 16, 'reserved'), // 6to4 (embeds an IPv4)
  ipv6Range('2001::', 32, 'reserved'), // Teredo (embeds an IPv4)
  ipv6Range('::ffff:0:0:0', 96, 'reserved'), // IPv4-translated (SIIT)
  ipv6Range('fc00::', 7, 'private'), // unique local
  ipv6Range('fe80::', 10, 'private'), // link-local
  ipv6Range('fec0::', 10, 'private'), // deprecated site-local
  ipv6Range('ff00::', 8, 'reserved'), // multicast
]

/**
 * Returns true when the first `prefix` bits of the address are those of the network.
 * @param {number[]} groups - Address, in 16-bit groups.
 * @param {Range} range - Network and prefix length.
 * @returns {boolean} True when the address is in the range.
 */
const isInRange = (groups: number[], { network, prefix }: Range): boolean =>
  network.every((networkGroup, index) => {
    const bits = Math.min(Math.max(prefix - 16 * index, 0), 16)
    const mask = (0xffff << (16 - bits)) & 0xffff
    return (groups[index] & mask) === (networkGroup & mask)
  })

const classifyGroups = (groups: number[], ranges: Range[]): IpAddressClass =>
  ranges.find((range) => isInRange(groups, range))?.ipClass ?? 'public'

// ::ffff:a.b.c.d is the IPv4 address a.b.c.d (the URL parser writes it as ::ffff:xxxx:yyyy)
const toMappedIpv4Groups = (groups: number[]): number[] | null =>
  groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff ? groups.slice(6) : null

/**
 * Classifies an IP address; an IPv4-mapped IPv6 address is classified as the IPv4 address it carries.
 * @param {string} address - IPv4 or IPv6 address, without brackets. A zone id (fe80::1%eth0) is ignored.
 * @returns {IpAddressClass} The class; `invalid` when the text is not an IP address.
 */
export const classifyIpAddress = (address: string): IpAddressClass => {
  const text = address.toLowerCase().split('%')[0]
  const ipv4 = parseIpv4(text)
  if (ipv4) return classifyGroups(toGroups(ipv4), IPV4_RANGES)
  const ipv6 = parseIpv6(text)
  if (!ipv6) return 'invalid'
  const mapped = toMappedIpv4Groups(ipv6)
  return classifyGroups(mapped ?? ipv6, mapped ? IPV4_RANGES : IPV6_RANGES)
}

/**
 * Returns true when an address must not be called from the server: anything but a public address, an unreadable
 * address included.
 * @param {string} address - IPv4 or IPv6 address.
 * @returns {boolean} True when blocked.
 */
export const isNonPublicIpAddress = (address: string): boolean => classifyIpAddress(address) !== 'public'
