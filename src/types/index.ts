export interface GATEWAY {
  operatorStake: number
  vaults: { balance: number; start: number; end: number }[]
  settings: {
    label: string
    fqdn: string
    port: number
    protocol: string
    properties: string
    note: string
  }
  status: string
  start: number
  end: number
  online: boolean
}

export interface GAR {
  [key: string]: GATEWAY
}

export interface CacheOptions {
  location: string
  expirationTime: number
}

export type ROUTING_METHOD =
  | 'RANDOM_ROUTE_METHOD'
  | 'STAKE_RANDOM_ROUTE_METHOD'
  | 'HIGHEST_STAKE_ROUTE_METHOD'
  | 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD'
