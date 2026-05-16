export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-pxtorem': {
      // rootValue: 75,
      rootValue: 37.5,
      propList: ['*']
    }
  }
};
