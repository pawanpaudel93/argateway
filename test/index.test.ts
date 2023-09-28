import { beforeAll, describe, expect, it } from 'vitest'
import type { GatewayAddressRegistry } from '../src'
import { ArGateway, DEFAULT_GATEWAY } from '../src'

describe('ArGateway', () => {
  let arGateway: ArGateway

  beforeAll(() => {
    arGateway = new ArGateway()
  })

  it('should get an online gateway', async () => {
    const gateway = await arGateway.getOnlineGateway({ routingMethod: 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD' })
    expect(gateway).toHaveProperty('settings')
  })

  it('should get an online gateway with selection algorithm', async () => {
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
  })
}, { timeout: 60000 })
