module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/hooks': './src/hooks',
          '@/contexts': './src/contexts',
          '@/lib': './src/lib',
          '@/theme': './src/theme',
          '@/types': './src/types',
          '@/navigation': './src/navigation',
        },
      },
    ],
  ],
};
