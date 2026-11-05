type Ipv4Cidr = { base: number; prefixLength: number }
type Ipv6Cidr = { base: number[]; prefixLength: number }

// decimal parts only, no leading zeros: other forms are normalised by the URL parser or refused
const IPV4_PART_PATTERN = /^(0|[1-9]\d{0,2})$/
const HEXTET_PATTERN = /^[0-9a-f]{1,4}$/

/**
 * Removes the square brackets around an IPv6 URL host.
 * @param {string} host - The host, e.g. "[::1]".
 * @returns {string} The host without brackets, e.g. "::1".
 */
export const stripBrackets = (host: string): string =>
  host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host

/**
 * Parses a dotted-decimal IPv4 address.
 * @param {string} text - The address, e.g. "192.168.1.20".
 * @returns {number[]|null} The four octets, or null when the text is not a dotted-decimal IPv4 address.
 */
export const parseIpv4 = (text: string): number[] | null => {
  const parts = text.split('.')
  if (parts.length !== 4) return null
  const octets: number[] = []
  for (const part of parts) {
    if (!IPV4_PART_PATTERN.test(part)) return null
    const value = Number(part)
    if (value > 255) return null
    octets.push(value)
  }
  return octets
}

/**
 * Parses colon-separated hextets ("2001:db8").
 * @param {string} text - The hextets; an empty text is an empty list.
 * @returns {number[]|null} The hextet values, or null when a part is not a hextet.
 */
const parseHextets = (text: string): number[] | null => {
  if (text === '') return []
  const hextets: number[] = []
  for (const part of text.split(':')) {
    if (!HEXTET_PATTERN.test(part)) return null
    hextets.push(Number.parseInt(part, 16))
  }
  return hextets
}

/**
 * Splits an IPv6 address ending with a dotted IPv4 address ("::ffff:1.2.3.4") into its head and the two hextets of
 * the IPv4 tail.
 * @param {string} address - The lower-case IPv6 address.
 * @returns {{head: string, tail: number[]}|null} The head and the tail hextets ([] without IPv4 tail), or null when
 * the IPv4 tail is invalid.
 */
const splitIpv4Tail = (address: string): { head: string; tail: number[] } | null => {
  const lastColonIndex = address.lastIndexOf(':')
  const lastPart = address.slice(lastColonIndex + 1)
  if (!lastPart.includes('.')) return { head: address, tail: [] }
  const octets = parseIpv4(lastPart)
  if (!octets) return null
  const headWithColon = address.slice(0, lastColonIndex + 1)
  const head = headWithColon.endsWith('::') ? headWithColon : headWithColon.slice(0, -1)
  return { head, tail: [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]] }
}

/**
 * Expands the "::" of an IPv6 address head.
 * @param {string} head - The address without IPv4 tail.
 * @param {number} hextetCount - How many hextets the head must have (8, or 6 with an IPv4 tail).
 * @returns {number[]|null} The hextets, or null when the head is invalid.
 */
const expandHextets = (head: string, hextetCount: number): number[] | null => {
  const halves = head.split('::')
  if (halves.length > 2) return null
  if (halves.length === 1) {
    const hextets = parseHextets(head)
    return hextets?.length === hextetCount ? hextets : null
  }
  const start = parseHextets(halves[0])
  const end = parseHextets(halves[1])
  // "::" stands for at least one zero hextet
  if (!start || !end || start.length + end.length >= hextetCount) return null
  const zeros = new Array<number>(hextetCount - start.length - end.length).fill(0)
  return [...start, ...zeros, ...end]
}

/**
 * Parses an IPv6 address, with or without brackets or IPv4 tail.
 * @param {string} text - The address, e.g. "[::ffff:127.0.0.1]".
 * @returns {number[]|null} The eight hextets, or null when the text is not an IPv6 address.
 */
export const parseIpv6 = (text: string): number[] | null => {
  const address = stripBrackets(text).toLowerCase()
  // zone ids ("fe80::1%eth0") are refused: neither URL hosts nor DNS answers carry them
  if (!address.includes(':') || address.includes('%')) return null
  const split = splitIpv4Tail(address)
  if (!split) return null
  const head = expandHextets(split.head, 8 - split.tail.length)
  return head ? [...head, ...split.tail] : null
}

/**
 * Tells the IP version of a host.
 * @param {string} host - The host (IP literal or name).
 * @returns {number} 4 or 6 for IP literals, 0 for names.
 */
export const getIpFamily = (host: string): 0 | 4 | 6 => {
  if (parseIpv4(host)) return 4
  if (parseIpv6(host)) return 6
  return 0
}

/**
 * Converts IPv4 octets to an unsigned 32-bit number.
 * @param {number[]} octets - The four octets.
 * @returns {number} The address as a number.
 */
const toIpv4Number = (octets: number[]): number =>
  ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]

/**
 * Builds an IPv4 range.
 * @param {string} base - The first address of the range.
 * @param {number} prefixLength - The prefix length.
 * @returns {Ipv4Cidr} The range.
 */
const ipv4Cidr = (base: string, prefixLength: number): Ipv4Cidr => ({
  base: toIpv4Number(parseIpv4(base) as number[]),
  prefixLength,
})

/**
 * Builds an IPv6 range.
 * @param {string} base - The first address of the range.
 * @param {number} prefixLength - The prefix length.
 * @returns {Ipv6Cidr} The range.
 */
const ipv6Cidr = (base: string, prefixLength: number): Ipv6Cidr => ({
  base: parseIpv6(base) as number[],
  prefixLength,
})

/**
 * Tells whether an IPv4 address is in a range.
 * @param {number} value - The address as a number.
 * @param {Ipv4Cidr} cidr - The range.
 * @returns {boolean} True when the address is in the range.
 */
const isInIpv4Cidr = (value: number, { base, prefixLength }: Ipv4Cidr): boolean => {
  const mask = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0
  return (value & mask) >>> 0 === (base & mask) >>> 0
}

/**
 * Tells whether an IPv6 address is in a range.
 * @param {number[]} hextets - The address.
 * @param {Ipv6Cidr} cidr - The range.
 * @returns {boolean} True when the address is in the range.
 */
const isInIpv6Cidr = (hextets: number[], { base, prefixLength }: Ipv6Cidr): boolean => {
  let remainingBits = prefixLength
  for (let index = 0; index < 8 && remainingBits > 0; index += 1) {
    const bits = Math.min(16, remainingBits)
    const mask = (0xffff << (16 - bits)) & 0xffff
    if ((hextets[index] & mask) !== (base[index] & mask)) return false
    remainingBits -= bits
  }
  return true
}

// RFC 6890 special-purpose ranges that must never be reached from the server
// (NOSONAR: hardcoded IP addresses are the point of this deny-list)
const IPV4_NON_PUBLIC: Ipv4Cidr[] = [
  ipv4Cidr('0.0.0.0', 8), // "this network"
  ipv4Cidr('10.0.0.0', 8), // NOSONAR private
  ipv4Cidr('100.64.0.0', 10), // NOSONAR carrier-grade NAT
  ipv4Cidr('127.0.0.0', 8), // loopback
  ipv4Cidr('169.254.0.0', 16), // NOSONAR link-local, cloud metadata
  ipv4Cidr('172.16.0.0', 12), // NOSONAR private
  ipv4Cidr('192.0.0.0', 24), // NOSONAR IETF protocol assignments
  ipv4Cidr('192.0.2.0', 24), // documentation
  ipv4Cidr('192.168.0.0', 16), // NOSONAR private
  ipv4Cidr('198.18.0.0', 15), // NOSONAR benchmarking
  ipv4Cidr('198.51.100.0', 24), // documentation
  ipv4Cidr('203.0.113.0', 24), // documentation
  ipv4Cidr('224.0.0.0', 4), // NOSONAR multicast
  ipv4Cidr('240.0.0.0', 4), // NOSONAR reserved, broadcast
]

// ranges whose last 32 bits are an IPv4 address the connection ends up on
const IPV6_EMBEDDING_IPV4: Ipv6Cidr[] = [
  ipv6Cidr('::ffff:0:0', 96), // NOSONAR IPv4-mapped
  ipv6Cidr('64:ff9b::', 96), // NOSONAR NAT64
]

// the only IPv6 block allocated to global unicast: everything else is unrouted or special-purpose
const IPV6_GLOBAL_UNICAST = ipv6Cidr('2000::', 3)

const IPV6_NON_PUBLIC: Ipv6Cidr[] = [
  ipv6Cidr('::', 96), // unspecified, loopback, IPv4-compatible
  ipv6Cidr('::ffff:0:0:0', 96), // NOSONAR IPv4-translated (SIIT)
  ipv6Cidr('64:ff9b:1::', 48), // NOSONAR local-use NAT64
  ipv6Cidr('100::', 64), // NOSONAR discard
  ipv6Cidr('2001::', 23), // NOSONAR IETF protocol assignments: only a few sub-blocks are global, none is a map service
  ipv6Cidr('2001::', 32), // NOSONAR Teredo
  ipv6Cidr('2001:2::', 48), // NOSONAR benchmarking
  ipv6Cidr('2001:10::', 28), // NOSONAR ORCHID
  ipv6Cidr('2001:20::', 28), // NOSONAR ORCHIDv2
  ipv6Cidr('2001:db8::', 32), // documentation
  ipv6Cidr('2002::', 16), // NOSONAR 6to4
  ipv6Cidr('3ffe::', 16), // NOSONAR former 6bone
  ipv6Cidr('3fff::', 20), // NOSONAR documentation
  ipv6Cidr('fc00::', 7), // NOSONAR unique local
  ipv6Cidr('fe80::', 10), // NOSONAR link-local
  ipv6Cidr('fec0::', 10), // NOSONAR site-local (deprecated)
  ipv6Cidr('ff00::', 8), // NOSONAR multicast
]

/**
 * Tells whether an IPv4 address is publicly routable.
 * @param {number[]} octets - The four octets.
 * @returns {boolean} True when the address is in no special-purpose range.
 */
const isPublicIpv4 = (octets: number[]): boolean => {
  const value = toIpv4Number(octets)
  return !IPV4_NON_PUBLIC.some((cidr) => isInIpv4Cidr(value, cidr))
}

/**
 * Tells whether an IPv6 address is publicly routable; IPv4-mapped and NAT64 addresses are judged by their IPv4 part, the rest must be global unicast outside the special-purpose ranges.
 * @param {number[]} hextets - The eight hextets.
 * @returns {boolean} True when the address is in no special-purpose range.
 */
const isPublicIpv6 = (hextets: number[]): boolean => {
  if (IPV6_EMBEDDING_IPV4.some((cidr) => isInIpv6Cidr(hextets, cidr))) {
    const [high, low] = [hextets[6], hextets[7]]
    return isPublicIpv4([high >> 8, high & 0xff, low >> 8, low & 0xff])
  }
  if (!isInIpv6Cidr(hextets, IPV6_GLOBAL_UNICAST)) return false
  return !IPV6_NON_PUBLIC.some((cidr) => isInIpv6Cidr(hextets, cidr))
}

/**
 * Tells whether an address is a public IPv4 or IPv6 address the server may connect to.
 * @param {string} text - The address, as returned by DNS or as a URL host (brackets allowed).
 * @returns {boolean} True for public addresses; false for special-purpose ranges and for anything that is not an IP.
 */
export const isPublicIpAddress = (text: string): boolean => {
  const ipv4 = parseIpv4(text)
  if (ipv4) return isPublicIpv4(ipv4)
  const ipv6 = parseIpv6(text)
  if (ipv6) return isPublicIpv6(ipv6)
  return false
}
