import type { NodeFormProps } from './types'
import { parseV2rayUrl } from '@daeuniverse/dae-node-parser'
import { createPortal } from 'react-dom'

import { FormActions } from '~/components/FormActions'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { NumberInput } from '~/components/ui/number-input'
import { Select } from '~/components/ui/select'
import { useNodeForm } from '~/hooks'
import {
  DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
  generateV2rayLink,
  type V2rayFormValues,
  v2rayFormSchema,
} from './v2rayLink'
export type { V2rayFormValues } from './v2rayLink'

export function V2rayForm({ onLinkGeneration, initialValues, actionsPortal }: NodeFormProps<V2rayFormValues>) {
  const { formValues, setValue, handleSubmit, onSubmit, submit, resetForm, isDirty, isValid, errors, t } = useNodeForm({
    schema: v2rayFormSchema,
    defaultValues: DEFAULT_V2RAY_PROTOCOL_FORM_VALUES,
    initialValues,
    onLinkGeneration,
    generateLink: generateV2rayLink,
    parseLink: parseV2rayUrl,
  })
  const networkOptions = [
    { label: 'TCP', value: 'tcp' },
    { label: 'mKCP', value: 'kcp' },
    { label: 'WebSocket', value: 'ws' },
    { label: 'HTTP/2', value: 'h2' },
    { label: 'gRPC', value: 'grpc' },
    { label: 'HTTPUpgrade', value: 'httpupgrade' },
    ...(formValues.protocol === 'vless' ? [{ label: t('configureNode.xhttp'), value: 'xhttp' }] : []),
  ]
  const showXhttpFields = formValues.protocol === 'vless' && formValues.net === 'xhttp'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Select
        label={t('configureNode.protocol')}
        data={[
          { label: 'VMESS', value: 'vmess' },
          { label: 'VLESS', value: 'vless' },
        ]}
        value={formValues.protocol}
        onChange={(val) => {
          const protocol = (val || 'vmess') as V2rayFormValues['protocol']

          setValue('protocol', protocol)
          if (protocol === 'vmess' && formValues.net === 'xhttp') {
            setValue('net', 'tcp')
          }
        }}
      />

      <Input label={t('configureNode.name')} value={formValues.ps} onChange={(e) => setValue('ps', e.target.value)} />

      <Input
        label={t('configureNode.host')}
        withAsterisk
        value={formValues.add}
        onChange={(e) => setValue('add', e.target.value)}
      />

      <NumberInput
        label={t('configureNode.port')}
        withAsterisk
        min={0}
        max={65535}
        value={formValues.port}
        onChange={(val) => setValue('port', Number(val))}
      />

      <Input label="ID" withAsterisk value={formValues.id} onChange={(e) => setValue('id', e.target.value)} />

      {formValues.protocol === 'vmess' && (
        <NumberInput
          label="AlterID"
          min={0}
          max={65535}
          value={formValues.aid}
          onChange={(val) => setValue('aid', Number(val))}
        />
      )}

      {formValues.protocol === 'vmess' && (
        <Select
          label={t('configureNode.security')}
          data={[
            { label: 'auto', value: 'auto' },
            { label: 'aes-128-gcm', value: 'aes-128-gcm' },
            { label: 'chacha20-poly1305', value: 'chacha20-poly1305' },
            { label: 'none', value: 'none' },
            { label: 'zero', value: 'zero' },
          ]}
          value={formValues.scy}
          onChange={(val) => setValue('scy', (val || 'auto') as V2rayFormValues['scy'])}
        />
      )}

      {formValues.type !== 'dtls' && (
        <Select
          label="TLS"
          data={[
            { label: 'off', value: 'none' },
            { label: 'tls', value: 'tls' },
            { label: 'reality', value: 'reality' },
          ]}
          value={formValues.tls}
          onChange={(val) => setValue('tls', (val || 'none') as V2rayFormValues['tls'])}
        />
      )}

      {formValues.tls !== 'none' && (
        <Input label="SNI" value={formValues.sni} onChange={(e) => setValue('sni', e.target.value)} />
      )}

      {formValues.tls === 'reality' && (
        <>
          <Input
            label={t('configureNode.publicKey')}
            withAsterisk
            value={formValues.pbk}
            onChange={(e) => setValue('pbk', e.target.value)}
          />
          <Select
            label={t('configureNode.fingerprint')}
            data={[
              { label: 'chrome', value: 'chrome' },
              { label: 'firefox', value: 'firefox' },
              { label: 'safari', value: 'safari' },
              { label: 'edge', value: 'edge' },
              { label: 'ios', value: 'ios' },
              { label: 'android', value: 'android' },
              { label: 'random', value: 'random' },
              { label: 'randomized', value: 'randomized' },
            ]}
            value={formValues.fp || 'chrome'}
            onChange={(val) => setValue('fp', val || 'chrome')}
          />
          <Input
            label={t('configureNode.shortId')}
            value={formValues.sid}
            onChange={(e) => setValue('sid', e.target.value)}
          />
          <Input
            label={t('configureNode.spiderX')}
            value={formValues.spx}
            onChange={(e) => setValue('spx', e.target.value)}
          />
          <Input label="PQV (ML-DSA-65)" value={formValues.pqv} onChange={(e) => setValue('pqv', e.target.value)} />
        </>
      )}

      <Select
        label="Flow"
        data={[
          { label: 'none', value: 'none' },
          { label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' },
          { label: 'xtls-rprx-vision-udp443', value: 'xtls-rprx-vision-udp443' },
        ]}
        value={formValues.flow}
        onChange={(val) => setValue('flow', (val || 'none') as V2rayFormValues['flow'])}
      />

      {formValues.tls !== 'none' && (
        <Checkbox
          label="AllowInsecure"
          checked={formValues.allowInsecure}
          onCheckedChange={(checked) => setValue('allowInsecure', !!checked)}
        />
      )}

      <Select
        label={t('configureNode.network')}
        data={networkOptions}
        value={formValues.net}
        onChange={(val) => setValue('net', (val || 'tcp') as V2rayFormValues['net'])}
      />

      {formValues.net === 'tcp' && (
        <Select
          label={t('configureNode.type')}
          data={[
            { label: t('configureNode.noObfuscation'), value: 'none' },
            { label: t('configureNode.httpObfuscation'), value: 'srtp' },
          ]}
          value={formValues.type}
          onChange={(val) => setValue('type', (val || 'none') as V2rayFormValues['type'])}
        />
      )}

      {formValues.net === 'kcp' && (
        <Select
          label={t('configureNode.type')}
          data={[
            { label: t('configureNode.noObfuscation'), value: 'none' },
            { label: t('configureNode.srtpObfuscation'), value: 'srtp' },
            { label: t('configureNode.utpObfuscation'), value: 'utp' },
            { label: t('configureNode.wechatVideoObfuscation'), value: 'wechat-video' },
            { label: t('configureNode.dtlsObfuscation'), value: 'dtls' },
            { label: t('configureNode.wireguardObfuscation'), value: 'wireguard' },
          ]}
          value={formValues.type}
          onChange={(val) => setValue('type', (val || 'none') as V2rayFormValues['type'])}
        />
      )}

      {(formValues.net === 'ws' ||
        formValues.net === 'h2' ||
        formValues.net === 'httpupgrade' ||
        showXhttpFields ||
        formValues.tls === 'tls' ||
        (formValues.net === 'tcp' && formValues.type === 'http')) && (
        <Input
          label={t('configureNode.host')}
          value={formValues.host}
          onChange={(e) => setValue('host', e.target.value)}
        />
      )}

      {formValues.tls === 'tls' && (
        <>
          <Input label="ALPN" value={formValues.alpn} onChange={(e) => setValue('alpn', e.target.value)} />
          <Input
            label="ECH"
            placeholder="Encrypted Client Hello"
            value={formValues.ech}
            onChange={(e) => setValue('ech', e.target.value)}
          />
        </>
      )}

      {(formValues.net === 'ws' ||
        formValues.net === 'h2' ||
        formValues.net === 'httpupgrade' ||
        showXhttpFields ||
        (formValues.net === 'tcp' && formValues.type === 'http')) && (
        <Input
          label={t('configureNode.path')}
          value={formValues.path}
          onChange={(e) => setValue('path', e.target.value)}
        />
      )}

      {formValues.net === 'kcp' && (
        <Input label="Seed" value={formValues.path} onChange={(e) => setValue('path', e.target.value)} />
      )}

      {formValues.net === 'grpc' && (
        <>
          <Input label="ServiceName" value={formValues.path} onChange={(e) => setValue('path', e.target.value)} />
          <Select
            label="gRPC Mode"
            data={[
              { label: 'gun', value: 'gun' },
              { label: 'multi', value: 'multi' },
              { label: 'guna', value: 'guna' },
            ]}
            value={formValues.grpcMode}
            onChange={(val) => setValue('grpcMode', (val || 'gun') as V2rayFormValues['grpcMode'])}
          />
          <Input
            label="Authority"
            value={formValues.grpcAuthority}
            onChange={(e) => setValue('grpcAuthority', e.target.value)}
          />
        </>
      )}

      {showXhttpFields && (
        <>
          <Select
            label={t('configureNode.xhttpLinkType')}
            data={[
              { label: t('configureNode.xhttp'), value: 'xhttp' },
              { label: t('configureNode.splithttp'), value: 'splithttp' },
            ]}
            value={formValues.xhttpType}
            onChange={(val) => setValue('xhttpType', (val || 'xhttp') as V2rayFormValues['xhttpType'])}
          />
          <Input
            label={t('configureNode.xhttpMode')}
            value={formValues.xhttpMode}
            onChange={(e) => setValue('xhttpMode', e.target.value)}
          />
          <Input
            label={t('configureNode.xhttpExtra')}
            value={formValues.xhttpExtra}
            onChange={(e) => setValue('xhttpExtra', e.target.value)}
          />
        </>
      )}

      {actionsPortal ? (
        createPortal(
          <FormActions
            reset={resetForm}
            onSubmit={submit}
            isDirty={isDirty}
            isValid={isValid}
            errors={errors}
            requireDirty={false}
          />,
          actionsPortal,
        )
      ) : (
        <FormActions reset={resetForm} isDirty={isDirty} isValid={isValid} errors={errors} requireDirty={false} />
      )}
    </form>
  )
}
