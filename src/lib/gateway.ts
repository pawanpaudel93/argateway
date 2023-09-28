import axios from 'axios'
import type { CacheOptions, Gateway, GatewayAddressRegistry, RoutingMethod, SelectionFunction } from '../types'
import { DEFAULT_GARCACHE_URL, DEFAULT_GATEWAY, isObjectEmpty } from './utils'
import { Cache } from './cache'

/**
 * Represents an Arweave Gateway manager that selects gateways based on routing methods.
 */
export class ArGateway {
  #garCache: GatewayAddressRegistry = {}
  #defaultGARCacheURL = DEFAULT_GARCACHE_URL
  #defaultGateway = DEFAULT_GATEWAY
  #cache: Cache<GatewayAddressRegistry>

  /**
   * Creates a new ArGateway instance.
   * @param {object} options - The options for the ArGateway.
   * @param {string} [options.garCacheURL] - The URL for the Gateway Address Registry cache.
   * @param {Partial<CacheOptions>} [options.cacheOptions] - The options for caching.
   */
  constructor(options?: { garCacheURL?: string; cacheOptions?: Partial<CacheOptions> }) {
    this.#defaultGARCacheURL = options?.garCacheURL || this.#defaultGARCacheURL
    this.#cache = new Cache(options?.cacheOptions)
  }

  /**
   * Selects a random gateway from the top five staked online gateways.
   * @private
   * @param {GatewayAddressRegistry} gar - The Gateway Address Registry.
   * @returns {Gateway} - The selected gateway.
   */
  #selectRandomTopFiveStakedGateway(gar: GatewayAddressRegistry): Gateway {
  // Filter online gateways and sort them by stake in descending order
    const sortedGateways = Object.values(gar)
      .filter(gateway => gateway.online)
      .sort((a, b) => b.operatorStake - a.operatorStake)

    // If there are no online gateways, return the default gateway
    if (sortedGateways.length === 0) {
      console.log('No online gateways available. Using default.')
      return this.#defaultGateway
    }

    // Take the top 5 or all available online gateways if there are fewer than 5
    const top5 = sortedGateways.slice(0, Math.min(5, sortedGateways.length))

    // Randomly select one from the top 5
    const randomIndex = Math.floor(Math.random() * top5.length)
    return top5[randomIndex]
  }

  /**
   * Selects a weighted gateway based on operator stakes.
   * @private
   * @param {GatewayAddressRegistry} gar - The Gateway Address Registry.
   * @returns {Gateway} - The selected gateway.
   */
  #selectWeightedGateway(gar: GatewayAddressRegistry): Gateway {
    const onlineGateways = Object.values(gar).filter(
      gateway => gateway.online,
    )

    if (onlineGateways.length === 0) {
      console.log('No online gateways available. Using default.')
      return this.#defaultGateway
    }

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
    console.log('No gateways available. Using default.')
    return this.#defaultGateway
  }

  /**
   * Selects a random online gateway.
   * @private
   * @param {GatewayAddressRegistry} gar - The Gateway Address Registry.
   * @returns {Gateway} - The selected gateway.
   */
  #selectRandomGateway(gar: GatewayAddressRegistry): Gateway {
    // Filter out gateways that are offline
    const onlineGateways = Object.values(gar).filter(
      gateway => gateway.online,
    )

    // If there are no online gateways, handle this case appropriately
    if (onlineGateways.length === 0) {
      console.log('No online random gateways available. Using default')
      return this.#defaultGateway
    }

    // Select a random online gateway
    const randomIndex = Math.floor(Math.random() * onlineGateways.length)
    return onlineGateways[randomIndex]
  }

  /**
   * Selects the gateway with the highest operator stake.
   * @private
   * @param {GatewayAddressRegistry} gar - The Gateway Address Registry.
   * @returns {Gateway} - The selected gateway.
   */
  #selectHighestStakeGateway(gar: GatewayAddressRegistry): Gateway {
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
      console.log('No online gateways available. Using default.')
      return this.#defaultGateway
    }

    // If there's only one online gateway with the maximum stake, return it
    if (maxStakeGateways.length === 1)
      return maxStakeGateways[0]

    // If there are multiple online gateways with the same highest stake, pick a random one and return it
    const randomIndex = Math.floor(Math.random() * maxStakeGateways.length)
    return maxStakeGateways[randomIndex]
  }

  /**
   * Fetches online gateways from the cache or the network.
   * @returns {Promise<GatewayAddressRegistry>} - A promise that resolves to the online gateways.
   */
  async fetchOnlineGateways(): Promise<GatewayAddressRegistry> {
    // Use the cache to fetch online gateways data if available
    const cachedData = await this.#cache.get('onlineGateways')
    if (cachedData && !isObjectEmpty(cachedData))
      return cachedData

    // If not cached, fetch online gateways data
    const garCache = await this.fetchGatewayAddressRegistryCache()

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

  /**
   * Checks if a gateway is online.
   * @param {Gateway} gateway - The gateway to check.
   * @returns {Promise<boolean>} - A promise that resolves to true if the gateway is online, otherwise false.
   */
  async isGatewayOnline(gateway: Gateway): Promise<boolean> {
    const url = `${gateway.settings.protocol}://${gateway.settings.fqdn}:${gateway.settings.port}/`

    try {
      const response = await axios.head(url, { timeout: 5000 })
      return response.statusText === 'OK'
    }
    catch (error: any) {
      return false
    }
  }

  /**
   * Fetches the Gateway Address Registry cache.
   * @returns {Promise<GatewayAddressRegistry>} - A promise that resolves to the Gateway Address Registry data.
   */
  async fetchGatewayAddressRegistryCache(): Promise<GatewayAddressRegistry> {
    try {
      const response = await axios.get(this.#defaultGARCacheURL)
      return response.data.gateways || response.data.state.gateways || {}
    }
    catch (error: any) {
      console.error(error.message)
      return {}
    }
  }

  /**
   * Gets an online gateway using a specified routing method or selection function.
   * @param {object} options - The options for getting an online gateway.
   * @param {RoutingMethod} [options.routingMethod] - The routing method to use.
   * @param {SelectionFunction} [options.selectionFunction] - A custom selection function.
   * @returns {Promise<Gateway>} - The selected gateway.
   */
  async getOnlineGateway({
    routingMethod = 'HIGHEST_STAKE_ROUTE_METHOD',
    selectionFunction,
  }: {
    routingMethod?: RoutingMethod
    selectionFunction?: SelectionFunction
  }): Promise<Gateway> {
    if (isObjectEmpty(this.#garCache))
      this.#garCache = await this.fetchOnlineGateways()

    const garCache = this.#garCache
    let gateway: Gateway = this.#defaultGateway

    if (selectionFunction) {
      gateway = selectionFunction(garCache)
      console.log(
        'Selection function gateway being used: ',
        gateway.settings.fqdn,
      )
    }
    else {
      if (routingMethod === 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD') {
        gateway = this.#selectRandomTopFiveStakedGateway(garCache)
        console.log(
          'Random Top 5 staked gateway being used: ',
          gateway.settings.fqdn,
        )
      }
      else if (routingMethod === 'STAKE_RANDOM_ROUTE_METHOD') {
        gateway = this.#selectWeightedGateway(garCache)
        console.log(
          'Stake-weighted random gateway being used: ',
          gateway.settings.fqdn,
        )
      }
      else if (routingMethod === 'RANDOM_ROUTE_METHOD') {
        gateway = this.#selectRandomGateway(garCache)
        console.log('Random gateway being used: ', gateway.settings.fqdn)
      }
      else if (routingMethod === 'HIGHEST_STAKE_ROUTE_METHOD') {
        gateway = this.#selectHighestStakeGateway(garCache)
        console.log(
          'Highest staked gateway being used: ',
          gateway.settings.fqdn,
        )
      }
    }

    return gateway
  }
}
