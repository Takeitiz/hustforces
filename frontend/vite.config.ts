import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Load environment variables
    const env = loadEnv(mode, process.cwd(), '');

    // Create a map of environment variables to expose to the app
    const envWithProcessPrefix = Object.entries(env).reduce(
        (prev, [key, val]) => {
            return {
                ...prev,
                [`process.env.${key}`]: JSON.stringify(val),
            };
        },
        {}
    );

    return {
        plugins: [
            react(),
            tailwindcss(),
        ],
        define: {
            // This replaces 'global' with 'window' in the bundled code,
            // which helps libraries like sockjs-client that might expect 'global'.
            'global': 'window',
            // Make all environment variables available
            ...envWithProcessPrefix,
            // Backward compatibility
            __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
    };
});