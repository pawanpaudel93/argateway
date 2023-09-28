import axios from 'axios'
import type { CacheOptions, GAR, GATEWAY, ROUTING_METHOD } from '../types'
import { DEFAULT_GARCACHE_URL, DEFAULT_GATEWAY, isObjectEmpty } from './utils'
import { Cache } from './cache'

export class ArGateway {
  #garCache: GAR = {}
  #defaultGARCacheURL = DEFAULT_GARCACHE_URL
  #defaultGateway = DEFAULT_GATEWAY
  #cache: Cache

  constructor(params?: { garCacheURL?: string; cacheOptions?: CacheOptions }) {
    this.#defaultGARCacheURL = params?.garCacheURL || this.#defaultGARCacheURL
    this.#cache = new Cache(params?.cacheOptions)
  }

  private selectRandomTopFiveStakedGateway(gar: GAR) {
  // Filter online gateways and sort them by stake in descending order
    const sortedGateways = Object.values(gar)
      .filter(gateway => gateway.online)
      .sort((a, b) => b.operatorStake - a.operatorStake)

    // If there are no online gateways, return the default gateway
    if (sortedGateways.length === 0) {
      console.log('No online gateways available. Using default')
      return this.#defaultGateway
    }

    // Take the top 5 or all available online gateways if there are fewer than 5
    const top5 = sortedGateways.slice(0, Math.min(5, sortedGateways.length))

    // Randomly select one from the top 5
    const randomIndex = Math.floor(Math.random() * top5.length)
    return top5[randomIndex]
  }

  private selectWeightedGateway(gar: GAR) {
    const onlineGateways = Object.values(gar).filter(
      gateway => gateway.online,
    )

    // Calculate the total stake among online gateways
    const totalStake = onlineGateways.reduce(
      (accum, gateway) => accum + gateway.operatorStake,
      0,
    )

    // Generate a random number between 0 and totalStake
    let randomNum = Math.random() * totalStake

    // Find the gateway that this random number falls into
    for (const gateway of onlineGateways) {
      randomNum -= gateway.operatorStake
      if (randomNum <= 0)
        return gateway // This is the selected gateway based on its weight
    }

    // This point should never be reached if there's at least one online gateway, but just in case:
    console.log('No gateways available.  Using default.')
    return this.#defaultGateway
  }

  private selectRandomGateway(gar: GAR) {
    // Filter out gateways that are offline
    const onlineGateways = Object.values(gar).filter(
      gateway => gateway.online,
    )

    // If there are no online gateways, handle this case appropriately
    if (onlineGateways.length === 0) {
      console.log('No online random gateways available.  Using default')
      return this.#defaultGateway
    }

    // Select a random online gateway
    const randomIndex = Math.floor(Math.random() * onlineGateways.length)
    return onlineGateways[randomIndex]
  }

  private selectHighestStakeGateway(gar: GAR) {
    // Get the maximum stake value
    const maxStake = Math.max(
      ...Object.values(gar).map(gateway => gateway.operatorStake),
    )

    // Filter out all the gateways with this maximum stake value
    const maxStakeGateways = Object.values(gar).filter(
      gateway => gateway.operatorStake === maxStake && gateway.online,
    )

    // If there's no online gateway with the maximum stake, handle this case
    if (maxStakeGateways.length === 0) {
      console.log('No online gateways available.  Using default.')
      return this.#defaultGateway
    }

    // If there's only one online gateway with the maximum stake, return it
    if (maxStakeGateways.length === 1)
      return maxStakeGateways[0]

    // If there are multiple online gateways with the same highest stake, pick a random one and return it
    const randomIndex = Math.floor(Math.random() * maxStakeGateways.length)
    return maxStakeGateways[randomIndex]
  }

  private async fetchOnlineGateways(garCacheURL?: string) {
    // Use the cache to fetch online gateways data if available
    const cachedData = await this.#cache.get<{ [key: string]: GAR }>('onlineGateways')
    if (cachedData && !isObjectEmpty(cachedData))
      return cachedData

    // If not cached, fetch online gateways data
    const garCache = await this.fetchGatewayAddressRegistryCache(garCacheURL)

    const promises = Object.entries(garCache).map(
      async ([address, gateway]) => {
        gateway.online = await this.isGatewayOnline(gateway)
        return { address, gateway }
      },
    )

    const results = await Promise.allSettled(promises)
    results.forEach((result) => {
      if (result.status === 'fulfilled')
        garCache[result.value.address] = result.value.gateway
    })

    // Cache the fetched data for future use
    await this.#cache.set('onlineGateways', garCache)

    return garCache
  }

  public async isGatewayOnline(gateway: GATEWAY) {
    const url = `${gateway.settings.protocol}://${gateway.settings.fqdn}:${gateway.settings.port}/`

    const timeoutPromise = new Promise(
      // eslint-disable-next-line promise/param-names
      (_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`Request for ${url} timed out after 5 seconds`)),
          5 * 1000,
        ),
    )

    try {
      const response = await Promise.race([axios.head(url), timeoutPromise])
      return (response as any).statusText === 'OK'
    }
    catch (error: any) {
      console.log(error.message)
      return false
    }
  }

  public async fetchGatewayAddressRegistryCache(
    garCacheURL?: string,
  ): Promise<{ [key: string]: GATEWAY }> {
    return axios
      .get(garCacheURL || this.#defaultGARCacheURL)
      .then(response => response.data)
      .then(data => data.gateways ?? data.state.gateways)
  }

  public async getOnlineGateway({
    routingMethod = 'HIGHEST_STAKE_ROUTE_METHOD',
    garCacheURL,
    selectionFunction,
  }: {
    routingMethod?: ROUTING_METHOD
    garCacheURL?: string
    selectionFunction?: (gar: GAR) => GATEWAY
  }) {
    if (isObjectEmpty(this.#garCache))
      this.#garCache = await this.fetchOnlineGateways(garCacheURL)

    const garCache = this.#garCache
    let gateway: GATEWAY = this.#defaultGateway

    if (selectionFunction) {
      gateway = selectionFunction(garCache)
      console.log(
        'Selection function gateway being used: ',
        gateway.settings.fqdn,
      )
    }
    else {
      if (routingMethod === 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD') {
        gateway = this.selectRandomTopFiveStakedGateway(garCache)
        console.log(
          'Random Top 5 staked gateway being used: ',
          gateway.settings.fqdn,
        )
      }
      else if (routingMethod === 'STAKE_RANDOM_ROUTE_METHOD') {
        gateway = this.selectWeightedGateway(garCache)
        console.log(
          'Stake-weighted random gateway being used: ',
          gateway.settings.fqdn,
        )
      }
      else if (routingMethod === 'RANDOM_ROUTE_METHOD') {
        gateway = this.selectRandomGateway(garCache)
        console.log('Random gateway being used: ', gateway.settings.fqdn)
      }
      else if (routingMethod === 'HIGHEST_STAKE_ROUTE_METHOD') {
        gateway = this.selectHighestStakeGateway(garCache)
        console.log(
          'Highest staked gateway being used: ',
          gateway.settings.fqdn,
        )
      }
    }

    return gateway
  }
}