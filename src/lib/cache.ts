import type { CacheOptions } from '../types'

interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface CachedData {
  data: any
  expiration: number | null
}

const defaultCacheOptions: CacheOptions = {
  location: './cache/argateway',
  expirationTime: 3600,
}

/**
 * Represents a caching mechanism that can store and retrieve data using local storage.
 */
export class Cache {
  #storage?: Storage
  #cache: Record<string, any> = {}
  #cacheOptions: CacheOptions = defaultCacheOptions

  /**
   * Creates a new Cache instance with optional cache options.
   * @param {CacheOptions} [cacheOptions] - The options for caching.
   */
  constructor(cacheOptions?: CacheOptions) {
    this.#cacheOptions = { ...this.#cacheOptions, ...cacheOptions }
  }

  async #getLocalStorage() {
    if (this.#storage)
      return this.#storage
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      this.#storage = window.localStorage
    }
    else {
      const { LocalStorage } = await import('node-localstorage')
      this.#storage = new LocalStorage(this.#cacheOptions.location)
    }
    return this.#storage
  }

  /**
   * Gets cached data by a specified key.
   * @template T
   * @param {string} key - The key to retrieve cached data.
   * @returns {Promise<T | null>} - A promise that resolves to the cached data, or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    const storage = await this.#getLocalStorage()
    // Check if the data is in memory cache
    if (this.#cache[key])
      return this.#cache[key]

    // If not, check if it's in local storage
    const cachedData = storage.getItem(key)

    if (cachedData) {
      const { data, expiration } = JSON.parse(cachedData) as CachedData
      if (!expiration || Date.now() <= expiration) {
        // Update the in-memory cache
        this.#cache[key] = data
        return data
      }
    }

    // Data not found in cache
    return null
  }

  /**
   * Sets data in the cache with a specified key and optional expiration time.
   * @template T
   * @param {string} key - The key to store the data under.
   * @param {T} data - The data to be cached.
   * @param {number} [expirationTime] - The expiration time for the cached data in seconds.
   * @returns {Promise<void>} - A promise that resolves when the data is successfully cached.
   */
  async set<T>(key: string, data: T, expirationTime: number = this.#cacheOptions.expirationTime): Promise<void> {
    const storage = await this.#getLocalStorage()
    // Update the in-memory cache
    this.#cache[key] = data

    // Store the data in local storage
    const expiration = expirationTime ? Date.now() + expirationTime * 1000 : null
    storage.setItem(key, JSON.stringify({ data, expiration }))
  }
}
