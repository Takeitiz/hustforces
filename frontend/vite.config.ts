import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            tailwindcss(),
        ],
        define: {
            // This replaces 'global' with 'window' in the bundled code,
            // which helps libraries like sockjs-client that might expect 'global'.
            'global': 'window',
            // Your existing define for __APP_ENV__
            __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
    };
});
