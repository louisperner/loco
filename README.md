<p align="center">
  <img src="./public/cover_loco2.png" alt="Loco" width="500" />
</p>

<h1 align="center">LOCO</h1>

<p align="center">
  <strong>A powerful 3D interactive environment for immersive digital experiences</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-blue" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.174.0-green" alt="Three.js" />
  <img src="https://img.shields.io/badge/Electron-34.3.3-blueviolet" alt="Electron" />
  <img src="https://img.shields.io/badge/TypeScript-Latest-blue" alt="TypeScript" />
</p>

## ✨ Features

Loco is a cutting-edge 3D environment that combines powerful technologies to create immersive experiences:

- **First-Person Controls**: Navigate through 3D space with intuitive FPS-style controls
- **Image & Model Embedding**: Import and position images, videos, and 3D models
- **Drawing Tools**: Create and annotate directly in 3D space
- **Physics**: Enable/disable gravity and other physical properties
- **Customizable Environment**: Modify sky, floor, lighting, and more
- **Touch & Mobile Support**: Responsive controls for all devices
- **Environment Theming**: Change colors, opacity, and visual settings

## 🚀 Installation

### Desktop Application

```bash
# Clone the repository
git clone https://github.com/louisperner/loco

# Navigate to the project directory
cd loco

# Install dependencies
npm install

# Start the application
npm start
```

### Web Version

```bash
# Run the web version in development mode
npm run dev:browser
```

## 🎮 Usage

### Navigation

- **WASD** or **Arrow Keys**: Move around
- **Mouse**: Look around
- **Space**: Jump (when gravity is enabled)
- **Shift**: Run
- **E**: Open inventory/catalog

### Adding Content

1. Drag and drop images, videos, or 3D models into the environment
2. Position them with the crosshair
3. Click to confirm placement

### Environment Controls

- Customize the environment through the settings panel
- Adjust ground size, colors, lighting, and visual effects
- Toggle gravity and other physical properties

## 💻 Development

Loco is built with:

- **React**: UI framework
- **Three.js**: 3D rendering
- **Electron**: Desktop application framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Styling

### Development Commands

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Package desktop app
npm run package

# Make distributable
npm run make
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Loco.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Firebase Authentication Setup

To use the Firebase authentication features, you need to create a Firebase project and configure it:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Register your app in the Firebase console
3. Enable Authentication in the Firebase console:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google authentication methods
4. Create a `.env` file in the root directory with the following:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your Firebase project's configuration, which you can find in your Firebase project settings.

---

<p align="center">
  Made with ❤️ for creators, developers, and dreamers
</p> 