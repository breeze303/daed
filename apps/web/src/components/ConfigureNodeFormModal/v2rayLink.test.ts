import { Base64 } from 'js-base64'

beforeAll(() => {
  vi.stubGlobal('location', {
    protocol: 'http:',
    hostname: 'localhost',
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function decodeVmessPayload(link: string) {
  return JSON.parse(Base64.decode(link.slice('vmess://'.length))) as Record<string, unknown>
}

function expectVlessQueryValue(link: string, key: string, expected: string) {
  const url = new URL(link)

  expect(url.searchParams.get(key)).toBe(expected)
}

function expectRoundTripIdentity(parsed: Record<string, unknown>, fields: Record<string, unknown>) {
  for (const [key, value] of Object.entries(fields)) {
    expect(parsed[key]).toBe(value)
  }
}

it('round-trips a VLESS xhttp link through parseNodeUrl and preserves xhttp fields without gRPC semantics', async () => {
  const { parseNodeUrl } = await import('@daeuniverse/dae-node-parser')
  const { generateV2rayLink } = await import('./v2rayLink')

  const sourceLink =
    'vless://11111111-1111-1111-1111-111111111111@example.com:443?type=xhttp&security=tls&sni=edge.example.com&alpn=h2%2Chttp%2F1.1&host=cdn.example.com&path=%2Fapi%2Fv1%3Fed%3D2048&mode=auto&extra=%7B%22host%22%3A%22cdn.example.com%22%2C%22padding%22%3A32%7D#xhttp-roundtrip'

  const parsedNode = parseNodeUrl(sourceLink)

  expect(parsedNode?.type).toBe('v2ray')
  if (!parsedNode || parsedNode.type !== 'v2ray') {
    throw new Error('Expected parseNodeUrl to return a VLESS v2ray node')
  }

  const parsedData = parsedNode.data

  if (!parsedData || parsedData.protocol !== 'vless') {
    throw new Error('Expected parseNodeUrl to return VLESS data')
  }

  expect(parsedData.protocol).toBe('vless')
  expectRoundTripIdentity(parsedData as Record<string, unknown>, {
    net: 'xhttp',
    xhttpType: 'xhttp',
    path: '/api/v1?ed=2048',
    xhttpMode: 'auto',
    xhttpExtra: '{"host":"cdn.example.com","padding":32}',
    tls: 'tls',
    sni: 'edge.example.com',
    alpn: 'h2,http/1.1',
    grpcMode: 'gun',
    grpcAuthority: '',
    ps: 'xhttp-roundtrip',
  })

  const regeneratedLink = generateV2rayLink(parsedData as never)

  expectVlessQueryValue(regeneratedLink, 'type', 'xhttp')
  expectVlessQueryValue(regeneratedLink, 'path', '/api/v1?ed=2048')
  expectVlessQueryValue(regeneratedLink, 'mode', 'auto')
  expectVlessQueryValue(regeneratedLink, 'extra', '{"host":"cdn.example.com","padding":32}')
  expectVlessQueryValue(regeneratedLink, 'security', 'tls')
  expectVlessQueryValue(regeneratedLink, 'sni', 'edge.example.com')
  expectVlessQueryValue(regeneratedLink, 'alpn', 'h2,http/1.1')
  expect(new URL(regeneratedLink).hash).toBe('#xhttp-roundtrip')
  expect(regeneratedLink).not.toContain('authority=')
})

it('round-trips a VLESS splithttp link through parseV2rayUrl and preserves alias plus Reality fields', async () => {
  const { parseV2rayUrl } = await import('@daeuniverse/dae-node-parser')
  const { generateV2rayLink } = await import('./v2rayLink')

  const sourceLink =
    'vless://22222222-2222-2222-2222-222222222222@example.com:8443?type=splithttp&security=reality&sni=reality.example.com&fp=chrome&pbk=public-key-123&sid=shortid&spx=%2Freality&pqv=post-quantum&path=%2Fsplit%2Fpath&mode=packet-up&extra=%7B%22note%22%3A%22keep-as-string%22%2C%22padding%22%3A%220%22%7D#split-roundtrip'

  const parsed = parseV2rayUrl(sourceLink)

  if (!parsed || parsed.protocol !== 'vless') {
    throw new Error('Expected parseV2rayUrl to return a VLESS link')
  }

  expect(parsed.protocol).toBe('vless')
  expectRoundTripIdentity(parsed as Record<string, unknown>, {
    net: 'xhttp',
    xhttpType: 'splithttp',
    xhttpMode: 'packet-up',
    xhttpExtra: '{"note":"keep-as-string","padding":"0"}',
    path: '/split/path',
    tls: 'reality',
    sni: 'reality.example.com',
    fp: 'chrome',
    pbk: 'public-key-123',
    sid: 'shortid',
    spx: '/reality',
    pqv: 'post-quantum',
    grpcMode: 'gun',
    grpcAuthority: '',
  })

  const regeneratedLink = generateV2rayLink(parsed as never)

  expectVlessQueryValue(regeneratedLink, 'type', 'splithttp')
  expectVlessQueryValue(regeneratedLink, 'security', 'reality')
  expectVlessQueryValue(regeneratedLink, 'path', '/split/path')
  expectVlessQueryValue(regeneratedLink, 'mode', 'packet-up')
  expectVlessQueryValue(regeneratedLink, 'extra', '{"note":"keep-as-string","padding":"0"}')
  expectVlessQueryValue(regeneratedLink, 'sni', 'reality.example.com')
  expectVlessQueryValue(regeneratedLink, 'fp', 'chrome')
  expectVlessQueryValue(regeneratedLink, 'pbk', 'public-key-123')
  expectVlessQueryValue(regeneratedLink, 'sid', 'shortid')
  expectVlessQueryValue(regeneratedLink, 'spx', '/reality')
  expectVlessQueryValue(regeneratedLink, 'pqv', 'post-quantum')
  expect(regeneratedLink).not.toContain('authority=')
})

it('exports the selected xhttp alias for VLESS links', async () => {
  const { DEFAULT_V2RAY_PROTOCOL_FORM_VALUES, generateV2rayLink } = await import('./v2rayLink')

  const link = generateV2rayLink({
    ...DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
    protocol: 'vless',
    add: 'example.com',
    port: 443,
    id: '11111111-1111-1111-1111-111111111111',
    ps: 'alias-check',
    net: 'xhttp',
    xhttpType: 'splithttp',
    path: '/test',
    xhttpMode: 'auto',
    xhttpExtra: 'padding',
  })

  expect(link).toContain('type=splithttp')
  expect(link).toContain('path=%2Ftest')
  expect(link).toContain('mode=auto')
  expect(link).toContain('extra=padding')
})

it('preserves TCP+HTTP VMess header type and path while still clearing plain TCP extras', async () => {
  const { DEFAULT_V2RAY_PROTOCOL_FORM_VALUES, generateV2rayLink } = await import('./v2rayLink')

  const tcpHttpLink = generateV2rayLink({
    ...DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
    protocol: 'vmess',
    add: 'example.com',
    port: 443,
    id: '11111111-1111-1111-1111-111111111111',
    ps: 'tcp-http-regression',
    net: 'tcp',
    type: 'http',
    path: '/vmess-http-path',
  })

  const tcpHttpPayload = decodeVmessPayload(tcpHttpLink)

  expect(tcpHttpPayload.net).toBe('tcp')
  expect(tcpHttpPayload.type).toBe('http')
  expect(tcpHttpPayload.path).toBe('/vmess-http-path')

  const plainTcpLink = generateV2rayLink({
    ...DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
    protocol: 'vmess',
    add: 'example.com',
    port: 443,
    id: '11111111-1111-1111-1111-111111111111',
    ps: 'plain-tcp',
    net: 'tcp',
    type: 'none',
    path: '/should-clear',
  })

  const plainTcpPayload = decodeVmessPayload(plainTcpLink)

  expect(plainTcpPayload.net).toBe('tcp')
  expect(plainTcpPayload.type).toBe('')
  expect(plainTcpPayload.path).toBe('')
})

it('rejects VMess XHTTP export in schema and generator', async () => {
  const { parseNodeUrl, parseV2rayUrl } = await import('@daeuniverse/dae-node-parser')
  const { DEFAULT_V2RAY_PROTOCOL_FORM_VALUES, generateV2rayLink, v2rayFormSchema } = await import('./v2rayLink')

  const values = {
    ...DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
    protocol: 'vmess' as const,
    add: 'example.com',
    port: 443,
    id: '11111111-1111-1111-1111-111111111111',
    net: 'xhttp' as const,
    xhttpType: 'splithttp' as const,
  }

  expect(v2rayFormSchema.safeParse(values).success).toBe(false)
  expect(generateV2rayLink(values)).toBe('')

  const parsedVmess = parseV2rayUrl(
    'vmess://11111111-1111-1111-1111-111111111111@example.com:443?type=splithttp&path=%2Fvmess-should-not-be-xhttp&mode=auto&extra=padding&authority=grpc.example.com#vmess-unsupported',
  )

  expect(parsedVmess?.protocol).toBe('vmess')
  expect(parsedVmess?.net).toBe('tcp')
  expect(parsedVmess?.xhttpType).toBe('xhttp')
  expect(parsedVmess?.xhttpMode).toBe('')
  expect(parsedVmess?.xhttpExtra).toBe('')
  expect(parsedVmess?.grpcAuthority).toBe('')

  expect(parseNodeUrl('xhttp://example.com:443?type=xhttp')).toBeNull()
})
