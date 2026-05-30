import { generateURL } from '@daeuniverse/dae-node-parser'
import { Base64 } from 'js-base64'
import { z } from 'zod'

import { DEFAULT_V2RAY_FORM_VALUES } from '~/constants/default'
import { v2raySchema } from '~/constants/schema'

export const v2rayFormSchema = v2raySchema
  .extend({
    protocol: z.enum(['vmess', 'vless']),
  })
  .superRefine((value, ctx) => {
    if (value.protocol === 'vmess' && value.net === 'xhttp') {
      ctx.addIssue({
        code: 'custom',
        path: ['net'],
        message: 'VMess does not support XHTTP or SplitHTTP export.',
      })
    }
  })

export type V2rayFormValues = z.infer<typeof v2rayFormSchema>

export const DEFAULT_V2RAY_PROTOCOL_FORM_VALUES: V2rayFormValues = {
  protocol: 'vmess',
  ...DEFAULT_V2RAY_FORM_VALUES,
}

export function generateV2rayLink(data: V2rayFormValues): string {
  const {
    protocol,
    net,
    tls,
    path,
    host,
    type,
    sni,
    flow,
    allowInsecure,
    alpn,
    ech,
    id,
    add,
    port,
    ps,
    pbk,
    fp,
    sid,
    spx,
    pqv,
    grpcMode,
    grpcAuthority,
    xhttpMode,
    xhttpExtra,
    xhttpType,
  } = data

  if (protocol === 'vless') {
    const params: Record<string, unknown> = {
      type: net === 'xhttp' ? xhttpType : net,
      security: tls,
      host,
      headerType: type,
      sni,
      flow,
      allowInsecure,
    }

    if (net === 'grpc') {
      params.serviceName = path
      if (grpcMode !== 'gun') params.mode = grpcMode
      if (grpcAuthority) params.authority = grpcAuthority
    } else if (net === 'kcp') {
      params.seed = path
    } else if (net === 'xhttp') {
      params.path = path
      if (xhttpMode) params.mode = xhttpMode
      if (xhttpExtra) params.extra = xhttpExtra
    } else {
      params.path = path
    }

    if (alpn !== '') params.alpn = alpn
    if (ech !== '') params.ech = ech

    if (tls === 'reality') {
      params.pbk = pbk
      params.fp = fp
      if (sid) params.sid = sid
      if (spx) params.spx = spx
      if (pqv) params.pqv = pqv
    }

    return generateURL({
      protocol,
      username: id,
      host: add,
      port,
      hash: ps,
      params,
    })
  }

  if (protocol === 'vmess') {
    if (net === 'xhttp') return ''

    const body: Record<string, unknown> = structuredClone(data)
    const isTcpHttpHeader = body.net === 'tcp' && body.type === 'http'

    delete body.xhttpType

    if (!isTcpHttpHeader) body.type = ''

    if (body.net !== 'ws' && !isTcpHttpHeader) body.path = ''

    if (!(body.protocol === 'vless' && body.tls === 'xtls')) {
      delete body.flow
    }

    return `vmess://${Base64.encode(JSON.stringify(body))}`
  }

  return ''
}
