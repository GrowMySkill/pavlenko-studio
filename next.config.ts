import type { NextConfig } from 'next';

const githubPages = process.env.GITHUB_PAGES === 'true';

const config: NextConfig = githubPages ? {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  pageExtensions: ['tsx', 'jsx'],
  images: { unoptimized: true },
} : {};

export default config;
