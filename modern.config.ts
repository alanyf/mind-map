import { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/config/overview
export default defineConfig({
  // performance: {
  //   chunkSplit: {
  //     strategy: 'split-by-size',
  //     maxSize: 50000,
  //   },
  // },
  output: {
    favicon: './config/favicon.ico',
    disableTsChecker: true,
  },
})
