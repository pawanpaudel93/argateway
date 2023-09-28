import { Level } from 'level'
import type { CacheOptions } from '../types'

interface CachedData<T> {
  data: T
  expiration: number | null
}

const defaultCacheOptions: CacheOptions = {
  location: './cache/argateway',
  expirationTime: 3600,
}

/**
 * Represents a caching mechanism that can store and retrieve data using LevelDB.
 */
export class Cache<T> {
  #storage: Level<string, CachedData<T>>
  #cache: Record<string, CachedData<T>> = {}
  #cacheOptions: CacheOptions = defaultCacheOptions

  /**
   * Creates a new Cache instance with optional cache options.
   * @param {Partial<CacheOptions>} [cacheOptions] - The options for caching.
   */
  constructor(cacheOptions?: Partial<CacheOptions>) {
    this.#cacheOptions = { ...defaultCacheOptions, ...cacheOptions }
    this.#storage = new Level<string, CachedData<T>>(this.#cacheOptions.location, { valueEncoding: 'json' })
  }

  /**
   * Gets cached data by a specified key.
   * @param {string} key - The key to retrieve cached data.
   * @returns {Promise<T | null>} - A promise that resolves to the cached data, or null if not found.
   */
  async get(key: string): Promise<T | null> {
    // Check if the data is in memory cache
    const cachedItem = this.#cache[key]
    if (cachedItem && (!cachedItem.expiration || Date.now() <= cachedItem.expiration))
      return cachedItem.data

    // If not, check if it's in LevelDB
    try {
      const cachedData = await this.#storage.get(key)
      if (!cachedData.expiration || Date.now() <= cachedData.expiration) {
        // Update the in-memory cache
        this.#cache[key] = cachedData
        return cachedData.data
      }
    }
    catch (error) {
      // Data not found in LevelDB
    }

    // Data not found in cache
    return null
  }

  /**
   * Sets data in the cache with a specified key and optional expiration time.
   * @param {string} key - The key to store the data under.
   * @param {T} data - The data to be cached.
   * @returns {Promise<void>} - A promise that resolves when the data is successfully cached.
   */
  async set(key: string, data: T): Promise<void> {
    const expiration = this.#cacheOptions.expirationTime ? Date.now() + this.#cacheOptions.expirationTime * 1000 : null
    // Update the in-memory cache
    this.#cache[key] = { data, expiration }
    // Store the data in LevelDB
    await this.#storage.put(key, { data, expiration })
  }
}
