import type { Gateway } from '../types'

export const DEFAULT_GARCACHE_URL = 'https://dev.arns.app/v1/contract/bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U/gateways'
export const DEFAULT_GATEWAY: Gateway = {
  operatorStake: 250000,
  vaults: [],
  settings: {
    label: 'AR.IO Test',
    fqdn: 'ar-io.dev',
    port: 443,
    protocol: 'https',
    properties: 'raJgvbFU-YAnku-WsupIdbTsqqGLQiYpGzoqk9SCVgY',
    note: 'Test Gateway operated by PDS for the AR.IO ecosystem.',
  },
  status: 'joined',
  start: 1256694,
  end: 0,
  online: true,
}

export function isObjectEmpty(obj: object): boolean {
  // eslint-disable-next-line no-unreachable-loop
  for (const i in obj) return false
  return true
}
