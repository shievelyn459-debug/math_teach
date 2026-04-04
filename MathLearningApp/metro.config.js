/**
 * Metro Configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const config = {
  // 支持环境变量
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    // 处理react-native-config等模块的ESM/CommonJS混用问题
    unstable_enablePackageExports: true,
    resolverMainFields: ['react-native', 'browser', 'main'],
    // 对于expo模块，使用build目录而不是src目录
    resolveRequest: (context, moduleName, platform) => {
      // 对于expo模块，重定向到编译后的版本
      if (moduleName.startsWith('expo-') || moduleName.startsWith('expo/')) {
        const expoModulePath = path.resolve(context.originModulePath, '..', 'node_modules', moduleName);
        try {
          const buildPath = path.join(expoModulePath, 'build');
          // 如果build目录存在，使用它
          if (require('fs').existsSync(buildPath)) {
            return {
              filePath: path.join(buildPath, 'index.js'),
              type: 'sourceFile',
            };
          }
        } catch (e) {
          // 忽略错误，使用默认解析
        }
      }
      // 使用默认解析器
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  // 确保正确处理node_modules
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  server: {
    port: 8081,
  },
  // 排除expo模块的TypeScript源文件，只使用编译后的JS版本
  watchFolders: [],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
