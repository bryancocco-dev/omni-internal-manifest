/** @type { import('@storybook/html-vite').StorybookConfig } */
export default {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|mjs|ts)'
  ],
  addons: [
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  staticDirs: ['../public', '../dist'],
  docs: {}
};
