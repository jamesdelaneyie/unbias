# UNBIAS

A multiplayer environment. Networked with nengi.js, rendered by pixi.js and made physical with p2.js.

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd unbias
   ```

2. Install dependencies:

   ```bash
   nvm use 22
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

6th May:
~~Network and setup objects and player classes across client/server~~
~~Add lag compensation firing~~
~~login to vultr~~
~~create setup world in instance~~
~~expand worldConfig~~

13th May:
Get docker version working locally
Deploy on old vultr server
Move all UI to pixi
check on mobile for framerate issue
see if render / p2 world step on client can be seperated
see if the patch to nengi can be removed
review connection manager for improvements
think of tests that could be created
put on a server
try with ngrok
smooth moving on server for entities

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
