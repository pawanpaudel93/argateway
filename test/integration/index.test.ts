import { beforeAll, describe, expect, it } from 'vitest'
import type { GatewayAddressRegistry } from '../../src'
import { ArGateway, DEFAULT_GATEWAY } from '../../src'

describe('ArGateway', () => {
  let arGateway: ArGateway

  beforeAll(() => {
    arGateway = new ArGateway()
  })

  it('should get an online gateway with routing methods', async () => {
    const routingMethods = ['RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD', 'STAKE_RANDOM_ROUTE_METHOD', 'RANDOM_ROUTE_METHOD', 'HIGHEST_STAKE_ROUTE_METHOD'] as const
    routingMethods.forEach(async (routingMethod) => {
      const gateway = await arGateway.getOnlineGateway({ routingMethod })
      expect(gateway).toHaveProperty('settings')
      expect(gateway.online).toEqual(true)
    })
  })

  it('should get an online gateway with selection function', async () => {
    const gateway = await arGateway.getOnlineGateway({
      selectionFunction: (gar: GatewayAddressRegistry) => {
        const onlineGateways = Object.values(gar).filter(gateway => gateway.online)

        if (onlineGateways.length === 0)
          return DEFAULT_GATEWAY

        const randomIndex = Math.floor(Math.random() * onlineGateways.length)
        return onlineGateways[randomIndex]
      },
    })
    expect(gateway).toHaveProperty('settings')
    expect(gateway.online).toEqual(true)
  })

  it('should get true for online gateway', async () => {
    const isOnline = await arGateway.isGatewayOnline(DEFAULT_GATEWAY)
    expect(isOnline).toEqual(true)
  })

  it('should get false for offline gateway', async () => {
    const gateway = {
      ...DEFAULT_GATEWAY,
      settings: {
        ...DEFAULT_GATEWAY.settings,
        fqdn: 'my-gateway.io',
        port: 80,
      },
    }
    const isOnline = await arGateway.isGatewayOnline(gateway)
    expect(isOnline).toEqual(false)
  })

  it('should get gateways', async () => {
    const gateways = await arGateway.fetchOnlineGateways()
    expect(Object.values(gateways).length).greaterThanOrEqual(1)
  })
}, { timeout: 60000 })
