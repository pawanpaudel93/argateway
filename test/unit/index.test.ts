/* eslint-disable no-restricted-globals */
import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ArGateway, DEFAULT_GARCACHE_URL, DEFAULT_GATEWAY } from '../../src'
import { Cache } from '../../src/lib/cache'

vi.mock('axios')

describe('ArGateway', () => {
  let arGateway: ArGateway

  beforeEach(() => {
    arGateway = new ArGateway()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetchGatewayAddressRegistryCache should fetch data successfully', async () => {
    const responseData = { gateways: { gateway1: {}, gateway2: {} } }

    // @ts-expect-error types
    axios.get.mockResolvedValueOnce({ data: responseData })

    const result = await arGateway.fetchGatewayAddressRegistryCache()

    expect(result).toEqual(responseData.gateways)
    expect(axios.get).toHaveBeenCalledWith(DEFAULT_GARCACHE_URL)
  })

  it('fetchGatewayAddressRegistryCache should handle errors', async () => {
    // @ts-expect-error types
    axios.get.mockRejectedValueOnce(new Error('Network Error'))

    const result = await arGateway.fetchGatewayAddressRegistryCache()

    expect(result).toEqual({})
    expect(axios.get).toHaveBeenCalledWith(DEFAULT_GARCACHE_URL)
  })

  it('isGatewayOnline should return true for online gateway', async () => {
    const gateway = DEFAULT_GATEWAY

    // @ts-expect-error types
    axios.head.mockResolvedValueOnce({ statusText: 'OK' })

    const result = await arGateway.isGatewayOnline(gateway)

    expect(result).toBe(true)
    expect(axios.head).toHaveBeenCalledWith('https://ar-io.dev:443/', { timeout: 5000 })
  })

  it('isGatewayOnline should return false for offline gateway', async () => {
    const gateway = { ...DEFAULT_GATEWAY, online: false }

    // @ts-expect-error types
    axios.head.mockRejectedValueOnce(new Error('Request failed with status code 404'))

    const result = await arGateway.isGatewayOnline(gateway)

    expect(result).toBe(false)
    expect(axios.head).toHaveBeenCalledWith('https://ar-io.dev:443/', { timeout: 5000 })
  })

  it('fetchOnlineGateways should return online gateways from cache', async () => {
    const cachedData = { gateway1: { online: true }, gateway2: { online: true } }
    const cacheGetMock = vi.spyOn(Cache.prototype, 'get')
    cacheGetMock.mockReturnValueOnce(Promise.resolve(cachedData))

    const result = await arGateway.fetchOnlineGateways()

    expect(result).toEqual(cachedData)
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('fetchOnlineGateways should fetch online gateways from network and cache them', async () => {
    const garCache = { gateway1: { online: true }, gateway2: { online: true } }

    // @ts-expect-error types
    axios.get.mockResolvedValueOnce({ data: { gateways: garCache } })

    const cacheGetMock = vi.spyOn(Cache.prototype, 'get')
    const cacheSetMock = vi.spyOn(Cache.prototype, 'set')

    cacheGetMock.mockReturnValueOnce(Promise.resolve(null))
    cacheSetMock.mockReturnValueOnce(Promise.resolve())

    const result = await arGateway.fetchOnlineGateways()

    expect(result).toEqual(garCache)
    expect(cacheSetMock).toHaveBeenCalledWith('onlineGateways', garCache)
    expect(axios.get).toHaveBeenCalledWith(DEFAULT_GARCACHE_URL)
  })

  it('getOnlineGateway should return default gateway when no gateways are available', async () => {
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue({})

    const result = await arGateway.getOnlineGateway({})
    expect(result).toEqual(DEFAULT_GATEWAY)
  })

  it('getOnlineGateway should return highest stake gateway when using HIGHEST_STAKE_ROUTE_METHOD', async () => {
    const onlineGateways = {
      gateway1: { operatorStake: 100, online: true, settings: { fqdn: 'ar-io-1.dev' } },
      gateway2: { operatorStake: 200, online: true, settings: { fqdn: 'ar-io-2.dev' } },
    }
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue(Promise.resolve(onlineGateways) as any)

    const result = await arGateway.getOnlineGateway({ routingMethod: 'HIGHEST_STAKE_ROUTE_METHOD' })

    expect(result).toEqual(onlineGateways.gateway2)
  })

  it('getOnlineGateway should return random top 5 staked gateway when using RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD', async () => {
    const onlineGateways = {
      gateway1: { operatorStake: 100, online: true, settings: { fqdn: 'ar-io-1.dev' } },
      gateway2: { operatorStake: 200, online: true, settings: { fqdn: 'ar-io-2.dev' } },
      gateway3: { operatorStake: 300, online: true, settings: { fqdn: 'ar-io-3.dev' } },
      gateway4: { operatorStake: 400, online: true, settings: { fqdn: 'ar-io-4.dev' } },
      gateway5: { operatorStake: 500, online: true, settings: { fqdn: 'ar-io-5.dev' } },
      gateway6: { operatorStake: 600, online: true, settings: { fqdn: 'ar-io-6.dev' } },
    }
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue(Promise.resolve(onlineGateways) as any)
    vi.spyOn(Math, 'random').mockResolvedValue(0.5)
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0.5
    global.Math = mockMath

    const result = await arGateway.getOnlineGateway({ routingMethod: 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD' })

    expect(result).toEqual(onlineGateways.gateway4)
  })

  it('getOnlineGateway should return stake-weighted random gateway when using STAKE_RANDOM_ROUTE_METHOD', async () => {
    const onlineGateways = {
      gateway1: { operatorStake: 100, online: true, settings: { fqdn: 'ar-io-1.dev' } },
      gateway2: { operatorStake: 200, online: true, settings: { fqdn: 'ar-io-2.dev' } },
      gateway3: { operatorStake: 300, online: true, settings: { fqdn: 'ar-io-3.dev' } },
    }
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue(Promise.resolve(onlineGateways) as any)
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0.7 // To simulate the random index 2 (indexing starts from 0)
    global.Math = mockMath

    const result = await arGateway.getOnlineGateway({ routingMethod: 'STAKE_RANDOM_ROUTE_METHOD' })

    expect(result).toEqual(onlineGateways.gateway3)
  })

  it('getOnlineGateway should return random gateway when using RANDOM_ROUTE_METHOD', async () => {
    const onlineGateways = {
      gateway1: { operatorStake: 100, online: true, settings: { fqdn: 'ar-io-1.dev' } },
      gateway2: { operatorStake: 200, online: true, settings: { fqdn: 'ar-io-2.dev' } },
      gateway3: { operatorStake: 300, online: true, settings: { fqdn: 'ar-io-3.dev' } },
    }
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue(Promise.resolve(onlineGateways) as any)
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0.5 // To simulate the random index 1 (indexing starts from 0)
    global.Math = mockMath

    const result = await arGateway.getOnlineGateway({ routingMethod: 'RANDOM_ROUTE_METHOD' })

    expect(result).toEqual(onlineGateways.gateway2)
  })

  it('getOnlineGateway should return random gateway when using selection function', async () => {
    const onlineGateways = {
      gateway1: { operatorStake: 100, online: true, settings: { fqdn: 'ar-io-1.dev' } },
      gateway2: { operatorStake: 200, online: true, settings: { fqdn: 'ar-io-2.dev' } },
      gateway3: { operatorStake: 300, online: true, settings: { fqdn: 'ar-io-3.dev' } },
    }
    vi.spyOn(arGateway, 'fetchOnlineGateways').mockResolvedValue(Promise.resolve(onlineGateways) as any)

    const result = await arGateway.getOnlineGateway({
      selectionFunction: (gar) => {
        return gar['gateway1']
      },
    })

    expect(result).toEqual(onlineGateways.gateway1)
  })
}, { timeout: 60000 })
