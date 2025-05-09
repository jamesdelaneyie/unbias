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

## To Do

Move all UI to Pixi
Load world for players before giving username
Add lag compensation firing
check on mobile for framerate issue
see if render / p2 world step on client can be seperated
restart server after an amount of time
login to vultr
see if pixi tagged text can be removed
see if the patch to nengi can be removed
shared playerEntity and Object entity
create setup world in instance
add basic room
try using gravity
review schemas
expand worldConfig
review connection manager for improvements
think of tests that could be created
put on a server
try with ngrok
figure out how to test reconcile entities
smooth moving on server for entities
write up about it

## Architecture

Mono-repo structure

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
