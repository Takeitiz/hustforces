# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# Hustforces Frontend

A modern competitive programming platform frontend built with React, TypeScript, and Tailwind CSS.

## Features

- 🚀 Built with React 19 + TypeScript + Vite
- 🎨 Styled with Tailwind CSS
- 🔒 Authentication system
- 📝 Problem viewing and submission
- 🏆 Contest participation
- 📊 Leaderboards and standings

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/hustforces.git
   cd hustforces/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── api/            # API client and endpoints
├── assets/         # Static assets like images
├── components/     # React components
│   ├── features/   # Feature-specific components
│   ├── layout/     # Layout components
│   └── ui/         # UI components
├── constants/      # Constants and enums
├── contexts/       # React contexts
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── routes/         # Routing configuration
├── services/       # Service layer for API calls
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Technologies Used

- **React**: UI library
- **TypeScript**: Type checking
- **Vite**: Build tool and development server
- **React Router**: For routing
- **Axios**: For API calls
- **Tailwind CSS**: For styling
- **React-Toastify**: For notifications
- **Monaco Editor**: For code editing
- **Radix UI**: For accessible UI components

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
