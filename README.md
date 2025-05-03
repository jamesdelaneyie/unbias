# BIAS2

A multiplayer environment. Networked with nengi.js, rendered by pixi.js and made physical with p2.js.

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd bias2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- **Client:** The client code is in `src/client/`.
- **Server:** The server code is in `src/server/`.
- **Common:** Shared code is in `src/common/`.

## Testing

Run tests with:

```bash
npm test
```

## Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service.

## Patches

pixi-tagged-text-plus: adds a parent container for Pixiv8 compatibility
nengi: fix that handles removal of most recently added entity

## License

ISC
