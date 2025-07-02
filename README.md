# GRPCKit

A modern, cross-platform gRPC client desktop application built with Electron, TypeScript, and React. Think "Postman for gRPC" with automatic service discovery, streaming support, and a beautiful interface.

![GRPCKit Interface](https://via.placeholder.com/800x500/2D3748/FFFFFF?text=GRPCKit+Interface)

## ✨ Features

### 🚀 Core Features

- **🔍 Automatic Service Discovery** - Uses gRPC reflection to automatically discover services and methods
- **📁 Proto File Import** - Manual mode with .proto file import support (Cmd+O / Ctrl+O)
- **🖥️ Cross-platform Desktop** - Native app for Windows, macOS, and Linux
- **🌙 Dark/Light Theme** - Automatic system theme detection with manual override
- **💾 Persistent Storage** - Settings and call history saved locally

### 🔐 Connection & Security

- **🔐 TLS/mTLS Support** - Secure connections with certificate management
- **🌐 Flexible Connectivity** - Connect to any gRPC server with reflection enabled
- **⚙️ Connection Options** - Custom metadata, timeouts, and advanced settings

### 📊 Request & Response

- **📝 JSON Request Builder** - Intuitive JSON-based request construction
- **📈 Response Panel** - Formatted response display with timing information
- **📋 Request History** - Persistent history of all gRPC calls with export options
- **🔄 Method Support** - Unary, server streaming, client streaming, and bidirectional streaming
- **📊 Metadata Support** - Add custom headers and metadata to requests

### 🎨 User Experience

- **🔔 Smart Notifications** - Toast notifications for connection status and errors
- **⚡ Fast Performance** - Built with modern web technologies for speed
- **🎯 Intuitive UI** - Clean, modern interface inspired by Postman
- **📱 Responsive Design** - Adaptive layout that works on different screen sizes

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** or **yarn**
- A gRPC server with reflection enabled

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone https://github.com/shrimalmadhur/grpckit.git
   cd grpckit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

The app will launch automatically. You can now connect to any gRPC server!

## 📖 Usage Guide

### 🔌 Connecting to a gRPC Server

1. **Launch GRPCKit**
2. **Enter your server URL** (e.g., `localhost:50051`, `grpc.example.com:443`)
3. **Configure security** (enable TLS if your server requires it)
4. **Click "Connect"**

The app will automatically discover all available services using gRPC reflection.

### 📝 Making Your First Request

1. **Select a service** from the left sidebar
2. **Choose a method** from the expanded service
3. **Enter request data** in JSON format in the Request Builder
4. **Add metadata** (optional) - click "+ Add" to include custom headers
5. **Set timeout** (optional) - default is 30 seconds
6. **Click "Send Request"**

### 📁 Working with Proto Files

If your server doesn't support reflection:

- **Menu → File → Import Proto File** 
- **Or press Cmd+O (Mac) / Ctrl+O (Windows/Linux)**
- Select your `.proto` file to load service definitions

### 📊 Streaming Support

GRPCKit supports all gRPC method types:
- **Unary** - Simple request/response
- **Server Streaming** - Single request, multiple responses
- **Client Streaming** - Multiple requests, single response  
- **Bidirectional Streaming** - Multiple requests and responses

### 📋 Managing History

- **View History** - Click the 📋 button in the bottom-right
- **Reuse Requests** - Click any history item to reload it
- **Export as grpcurl** - Copy requests as grpcurl commands
- **Clear History** - Remove old requests

### ⚙️ Settings & Customization

Click the ⚙️ button in the sidebar to access:
- **Theme** - Light, Dark, or System
- **Font Size** - Adjust for readability
- **Default Timeout** - Set global request timeout
- **Auto-connect** - Remember last connection

## 🏗️ Development

### 🛠️ Development Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/shrimalmadhur/grpcui.git
   cd grpcui
   npm install
   ```

2. **Start development mode**
   ```bash
   npm run dev
   ```
   This starts both the build watcher and Electron in development mode with hot reload.

3. **Open DevTools**
   - Development mode automatically opens Chrome DevTools
   - Or press Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows/Linux)

### 📁 Project Structure

```
grpcui/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # App entry point & window management
│   │   ├── grpcEngine.ts       # gRPC client & reflection logic
│   │   ├── storeManager.ts     # Persistent data storage
│   │   └── preload.ts          # IPC bridge (secure communication)
│   ├── renderer/               # React frontend
│   │   ├── App.tsx             # Main application component
│   │   ├── pages/              # Page-level components
│   │   │   └── ConnectScreen.tsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ServiceExplorer.tsx    # Service/method tree
│   │   │   ├── RequestBuilder.tsx     # JSON request editor
│   │   │   ├── ResponsePanel.tsx      # Response display
│   │   │   ├── StreamConsole.tsx      # Streaming interface
│   │   │   ├── HistoryDrawer.tsx      # Call history
│   │   │   ├── SettingsPanel.tsx      # App settings
│   │   │   └── NotificationManager.tsx # Toast notifications
│   │   └── styles/             # Global CSS
│   ├── store/                  # State management
│   │   └── appStore.ts         # Zustand store (app state)
│   ├── shared/                 # Shared utilities
│   └── types/                  # TypeScript definitions
├── dist/                       # Built files (auto-generated)
├── build/                      # Build configuration
└── package.json               # Dependencies & scripts
```

### 🔧 Available Scripts

```bash
# Development
npm start              # Start the built app
npm run dev           # Development mode with hot reload
npm run build         # Build for production
npm run build:watch   # Build with file watching

# Distribution
npm run dist          # Package for current platform
npm run dist:mac      # Package for macOS
npm run dist:win      # Package for Windows  
npm run dist:linux    # Package for Linux

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm test              # Run tests
```

### 🏗️ Architecture Overview

**Main Process (Node.js)**
- **grpcEngine.ts** - Handles all gRPC operations using `@grpc/grpc-js` and `grpc-js-reflection-client`
- **storeManager.ts** - Persistent storage using `electron-store`
- **main.ts** - Window management, menus, and IPC handlers

**Renderer Process (React)**
- **React 18** with TypeScript for the UI
- **Zustand** for state management (simpler than Redux)
- **TailwindCSS** for styling (utility-first CSS)
- **IPC communication** with main process for gRPC operations

**Key Technologies**
- **Electron** - Cross-platform desktop framework
- **TypeScript** - Type safety and better DX
- **React** - Component-based UI
- **gRPC-js** - Pure JavaScript gRPC implementation
- **Reflection Client** - Automatic service discovery
- **TailwindCSS** - Utility-first styling

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🐛 Bug Reports

1. **Check existing issues** first
2. **Create a detailed issue** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Your OS and Node.js version
   - Screenshots if applicable

### ✨ Feature Requests

1. **Check the roadmap** below
2. **Open an issue** describing:
   - The problem you're solving
   - Your proposed solution
   - Why it would benefit other users

### 💻 Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types for new code
   - Update tests if applicable
4. **Test your changes**
   ```bash
   npm run build
   npm start
   ```
5. **Submit a pull request**

### 📝 Development Guidelines

- **TypeScript** - All new code should be typed
- **Components** - Keep React components small and focused
- **State** - Use Zustand store for global state, local state for component-specific data
- **Styling** - Use TailwindCSS classes, avoid custom CSS when possible
- **IPC** - All gRPC operations should go through the main process

## 🗺️ Roadmap

### 🎯 v1.1 (Next Release)
- [ ] **Environment Management** - Save and switch between different server configurations
- [ ] **Advanced Streaming Console** - Real-time streaming with pause/resume controls
- [ ] **Certificate Management UI** - Visual certificate selection and validation
- [ ] **Export/Import** - Share configurations and history between instances
- [ ] **Request Templates** - Save and reuse common request patterns

### 🚀 v1.2 (Future)
- [ ] **Auto-updates** - Automatic application updates
- [ ] **Plugin System** - Extend functionality with custom plugins
- [ ] **Performance Optimizations** - Faster startup and response handling
- [ ] **Advanced Request Builder** - Schema-aware JSON editor with validation
- [ ] **Load Testing** - Send multiple requests for performance testing

### 🌟 v2.0 (Long-term)
- [ ] **Cloud Sync** - Sync settings and history across devices
- [ ] **Team Collaboration** - Share configurations with team members
- [ ] **Advanced Analytics** - Request timing, success rates, and insights
- [ ] **Mobile App** - React Native version for mobile testing
- [ ] **gRPC-Web Support** - Test gRPC-Web services from browsers

## 🔧 Troubleshooting

### Common Issues

**"No services discovered"**
- Ensure your gRPC server has reflection enabled
- Try importing a .proto file manually
- Check that you're connecting to the correct address

**"Connection failed"**
- Verify the server is running and accessible
- Check if TLS is required but not enabled
- Ensure no firewall is blocking the connection

**"Service X not found"**
- Click "Refresh Services" to re-discover services
- Try disconnecting and reconnecting
- Check server logs for reflection errors

### Debug Logs

Development mode shows detailed logs in DevTools console. For production debugging:

1. **Enable verbose logging** in Settings
2. **Check the main process logs** in the terminal where you started the app
3. **Look for gRPC errors** in the Response panel

### Getting Help

- **GitHub Issues** - Report bugs and request features
- **Discussions** - Ask questions and share tips
- **Documentation** - Check this README and inline help

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **gRPC Team** - For the excellent gRPC ecosystem
- **Electron Team** - For making cross-platform desktop apps possible
- **React Team** - For the amazing UI framework
- **Open Source Community** - For all the incredible libraries we use

---

**Made with ❤️ by the GRPCKit team**

*Star ⭐ this repo if you find it useful!*
