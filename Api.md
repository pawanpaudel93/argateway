# ArGateway API Documentation

ArGateway is a JavaScript library for selecting Arweave gateways based on various routing methods. This document provides detailed information about the library's API.

## Table of Contents

- [Class: ArGateway](#class-argateway)
  - [Constructor](#constructor)
  - [Methods](#methods)

---

## Class: ArGateway

The `ArGateway` class is the core component of the ArGateway library. It allows you to manage and select Arweave gateways based on routing methods.

### Constructor

#### `new ArGateway(options: { garCacheURL?: string; cacheOptions?: CacheOptions })`

Creates a new `ArGateway` instance.

- `options` (optional): An object containing configuration options.
  - `garCacheURL` (optional): The URL for the Gateway Address Registry cache.
  - `cacheOptions` (optional): The options for caching.

### Methods

#### `async getOnlineGateway(options: { routingMethod?: RoutingMethod; selectionFunction?: SelectionFunction }): Promise<Gateway>`

Gets an online gateway using a specified routing method or selection function.

- `options` (optional): An object containing options for getting an online gateway.
  - `routingMethod` (optional): The routing method to use. Defaults to `'HIGHEST_STAKE_ROUTE_METHOD'`.
  - `selectionFunction` (optional): A custom selection function.
- Returns: A promise that resolves to the selected gateway (`Gateway`).

#### `async fetchOnlineGateways(): Promise<GatewayAddressRegistry>`

Fetches online gateways from the cache or the network.

- Returns: A promise that resolves to the online gateways (`GatewayAddressRegistry`).

#### `async isGatewayOnline(gateway: Gateway): Promise<boolean>`

Checks if a gateway is online.

- `gateway`: The gateway to check.
- Returns: A promise that resolves to `true` if the gateway is online, otherwise `false`.

#### `async fetchGatewayAddressRegistryCache(): Promise<GatewayAddressRegistry>`

Fetches the Gateway Address Registry cache.

- Returns: A promise that resolves to the Gateway Address Registry data (`GatewayAddressRegistry`).

---

### Types

- `Gateway`: Represents a single Arweave gateway.
- `GatewayAddressRegistry`: Represents a record of gateways.
- `RoutingMethod`: Defines routing methods for gateway selection.
- `SelectionFunction`: A custom selection function for gateway selection.
- `CacheOptions`: Options for caching data.

## Example Usage

```javascript
import { ArGateway } from 'argateway';

// Create an instance of ArGateway with optional cache options
const gatewayManager = new ArGateway({
  garCacheURL: 'https://example.com/gar-cache',
  cacheOptions: {
    location: './cache/argateway',
    expirationTime: 3600,
  },
});

// Get an online gateway using a routing method or custom selection function
const selectedGateway = await gatewayManager.getOnlineGateway({
  routingMethod: 'RANDOM_ROUTE_METHOD',
});

console.log('Selected Gateway:', selectedGateway);
```

This is the complete API documentation for ArGateway. You can refer to the actual source code and inline comments for more detailed information about the implementation and usage of each method and type.
