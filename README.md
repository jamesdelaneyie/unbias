# UNBIAS

**A Real-Time Multiplayer Game Engine** built with modern web technologies for creating physics-based multiplayer experiences.

## 🎮 Overview

UNBIAS is a high-performance multiplayer game engine featuring real-time physics simulation, client-server synchronization, and lag compensation. Built on a foundation of proven technologies:

- **🌐 Networking**: [`nengi.js`](https://github.com/timetocode/nengi) for reliable multiplayer communication
- **🎨 Rendering**: [`pixi.js`](https://pixijs.com/) for high-performance 2D graphics
- **⚡ Physics**: [`p2.js`](https://github.com/schteppe/p2.js) for realistic physics simulation

## ✨ Features

### Core Engine

- **Real-time multiplayer** with authoritative server architecture
- **Client-side prediction** and server reconciliation
- **Lag compensation** for responsive gameplay
- **Physics-based** movement and interactions
- **Performance monitoring** with detailed metrics
- **Entity management** system with spatial partitioning

### Gameplay Features

- **Player movement** with WASD controls
- **Shooting mechanics** with hitscan and projectiles
- **Object interaction** and physics-based combat
- **Radial menu system** for context-sensitive actions
- **Real-time chat** and messaging system
- **Dynamic map loading** with configurable environments

### Developer Experience

- **TypeScript** throughout for type safety
- **Hot reloading** for both client and server
- **Comprehensive testing** setup with Vitest
- **ESLint + Prettier** for code quality
- **Docker support** for easy deployment

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** (see `.nvmrc`)
- **npm 10.9.2+**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd unbias
   ```

2. **Set up Node.js version:**

   ```bash
   nvm use 22  # or nvm use (reads from .nvmrc)
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Start development environment:**
   ```bash
   npm run dev
   ```
   This starts both the server (port 8080) and client development server simultaneously.

### Alternative Development Commands

- **Server only:** `npm run dev:server`
- **Client only:** `npm run dev:client`
- **Run AI bots:** `npm run bots`

## 🏗️ Architecture

### Project Structure

```
src/
├── client/          # Client-side game logic and rendering
│   ├── graphics/    # Pixi.js rendering and visual effects
│   └── ...
├── server/          # Authoritative game server
│   ├── applyCommands/ # Command processing and validation
│   └── ...
├── common/          # Shared code between client and server
│   ├── schemas/     # Network message definitions
│   └── ...
├── bots/           # AI players for testing
├── docs/           # Documentation
└── test/           # Test files
```

### Network Architecture

- **Client-Server Model**: Authoritative server with client prediction
- **Command-Based**: All player actions sent as commands to server
- **State Synchronization**: Server broadcasts world state to clients
- **Lag Compensation**: Server rewinds time for hit detection accuracy

### Key Systems

- **Entity System**: Manages players, objects, and world entities
- **Physics Engine**: Handles collisions, forces, and world simulation
- **Input System**: Processes user input with prediction
- **Performance Monitor**: Tracks server performance and optimization metrics

## 🧪 Development

### Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm test:watch

# Type checking
npm run typecheck
```

### Code Quality

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Building

```bash
# Build for production
npm run build

# Clean build directory
npm run clean
```

## 🐳 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting service
   - `dist/client/` - Static web assets
   - `dist/server/` - Node.js server application
   - `dist/bots/` - AI bot system

### Environment Configuration

Configure server settings in `src/common/config.ts`:

- Server port
- Tick rate
- Physics settings
- Performance thresholds

## 📚 Documentation

Comprehensive documentation is available in the [`src/docs/`](src/docs/) directory:

- **[Radial Menu System](src/docs/RadialMenu.md)** - Interactive UI component
- **[Performance Monitoring](src/docs/PERFORMANCE_MONITORING.md)** - Server metrics and optimization
- **[Physics Performance](src/docs/PHYSICS_PERFORMANCE_FIXES.md)** - Physics engine optimizations

## 🔧 Technical Details

### Dependencies

- **Runtime**: Node.js 22+, modern browsers with WebSocket support
- **Physics**: p2-es physics engine with optimizations
- **Graphics**: Pixi.js 8+ with WebGL rendering
- **Networking**: Custom nengi.js integration with WebSocket transport

### Patches Applied

- **pixi-tagged-text-plus**: Adds parent container for Pixi.js v8 compatibility
- **nengi**: Fixes entity removal handling for most recently added entities

### Performance Targets

- **60 TPS** server tick rate
- **Sub-100ms** input latency with lag compensation
- **50+ concurrent players** per server instance
- **Consistent frame rates** across devices

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature-name`
3. **Commit changes:** `git commit -m 'Add feature'`
4. **Run tests:** `npm test`
5. **Submit a pull request**

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation when needed
- Use semantic commit messages

## 📄 License

**ISC License** - See LICENSE file for details.

## 🚨 System Requirements

### Server

- **Node.js**: 22.14.0+
- **Memory**: 512MB+ RAM recommended
- **CPU**: Multi-core recommended for physics simulation

### Client

- **Browser**: Modern browser with WebGL and WebSocket support
- **Connection**: Stable internet connection (50ms+ latency supported)

---

Built with ❤️ for real-time multiplayer gaming experiences.
