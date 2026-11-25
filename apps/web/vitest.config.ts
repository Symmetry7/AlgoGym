import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},test:{include:['src/**/*.{test,spec}.{ts,tsx}','server/**/*.{test,spec}.{ts,tsx}','api/**/*.{test,spec}.{ts,tsx}'],environment:'node'}});
