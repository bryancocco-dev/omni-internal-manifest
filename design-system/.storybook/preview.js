import '../dist/tokens.css';

/** @type { import('@storybook/html').Preview } */
export default {
  parameters: {
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#F8F4E9' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'graphite', value: '#0B0B0B' }
      ]
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: {
        order: ['Welcome', 'Foundations', ['Color', 'Typography', 'Spacing', 'Radius & Borders', 'Elevation', 'Motion', 'Layering', 'Icons', 'Surface Preview'], 'Components']
      }
    }
  },
  globalTypes: {
    theme: {
      description: 'Light or dark theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark',  title: 'Dark'  }
        ]
      }
    }
  },
  decorators: [
    (story, ctx) => {
      document.documentElement.setAttribute('data-theme', ctx.globals.theme);
      return story();
    }
  ]
};
