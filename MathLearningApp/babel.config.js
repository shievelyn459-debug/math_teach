module.exports = {
  presets: [
    ['module:metro-react-native-babel-preset', {
      // Enable private methods and class properties
      // These are enabled by default in the metro preset
    }],
  ],
  plugins: [
    // Explicitly enable class properties and private methods for Jest
    ['@babel/plugin-transform-class-properties', { loose: false }],
    ['@babel/plugin-transform-private-methods', { loose: false }],
  ],
};
