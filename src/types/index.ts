export interface Gateway {
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

export interface GatewayAddressRegistry {
  [key: string]: Gateway
}

export interface CacheOptions {
  location: string
  expirationTime: number
}

export type SelectionFunction = (gar: GatewayAddressRegistry) => Gateway

export type RoutingMethod =
  | 'RANDOM_ROUTE_METHOD'
  | 'STAKE_RANDOM_ROUTE_METHOD'
  | 'HIGHEST_STAKE_ROUTE_METHOD'
  | 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD'
