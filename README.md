# ArGateway

ArGateway is a library for selecting Arweave gateways based on various routing methods. It provides a caching mechanism for efficient gateway selection and retrieval of online gateways.

## Features

- Select gateways using different routing methods:
  - Random Top Five Staked Gateway
  - Stake-weighted Random Gateway
  - Random Gateway
  - Highest Staked Gateway (default)
- Caching of online gateway data for improved performance
- Easy integration with Arweave applications

## Installation

To use ArGateway in your project, you can install it via npm or yarn:

```bash
npm install argateway
# or
yarn add argateway
# or
pnpm add argateway
# or
bun add argateway
```

## Usage

Here's an example of how to use ArGateway in your JavaScript/TypeScript project:

```typescript
import { ArGateway } from 'argateway';

// Create an instance of ArGateway with optional cache options
const gatewayManager = new ArGateway({
  garCacheURL: 'https://dev.arns.app/v1/contract/bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U/gateways', // Optional: Gateway Address Registry cache URL
  cacheOptions: {
    location: './cache/argateway', // Optional: Cache location
    expirationTime: 3600, // Optional: Cache expiration time in seconds
  },
});

// Example 1: Select a random gateway from the top five staked online gateways
const selectedGateway1 = await gatewayManager.getOnlineGateway({
  routingMethod: 'RANDOM_TOP_FIVE_STAKED_ROUTE_METHOD',
});


// Example 2: Select a gateway using a custom selection function
const selectedGateway2 = await gatewayManager.getOnlineGateway({
  selectionFunction: (gar) => {
    // Your custom logic to select a gateway
    // Must return a `Gateway` object
  },
});
```

For more details and examples, please refer to the [API Documentation](./Api.md).

## Author

👤 **Pawan Paudel**

- Github: [@pawanpaudel93](https://github.com/pawanpaudel93)

## 🤝 Contributing

Contributions, issues and feature requests are welcome! \ Feel free to check [issues page](https://github.com/pawanpaudel93/argateway/issues).

## Show your support

Give a ⭐️ if this project helped you!

Copyright © 2023 [Pawan Paudel](https://github.com/pawanpaudel93).

## License and Attribution

This project incorporates code from the [WayFinder](https://github.com/ar-io/wayfinder) repository, which is governed by the GNU General Public License v3.0 (GPL-3.0). The complete text of the GPL-3.0 license can be found in the [LICENSE](https://github.com/ar-io/wayfinder/blob/develop/LICENSE) file.

I extend my gratitude to the original authors for their contributions. Specific code utilized from the [WayFinder](https://github.com/ar-io/wayfinder) can be located in the [background.js](https://github.com/ar-io/wayfinder/blob/develop/background.js) file.

For additional information, please consult the [WayFinder repository](https://github.com/ar-io/wayfinder).

Happy Arweaving with ArGateway!
