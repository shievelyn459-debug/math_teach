#!/bin/bash
# react-native-config iOS环境变量加载脚本
# 这个脚本会在构建时读取.env文件并生成.h文件

EXPORT_VARIABLES=()
while IFS='=' read -r key value; do
  # 跳过注释和空行
  [[ $key =~ ^#.*$ ]] && continue
  [[ -z $key ]] && continue
  
  # 移除值两端的空格和引号
  value=$(echo "$value" | xargs)
  
  # 添加到导出列表
  EXPORT_VARIABLES+=("$key")
done < ../.env

# 生成.h文件
echo "#ifndef ReactNativeConfigGenerated_h" > "ReactNativeConfig/ReactNativeConfigGenerated.h"
echo "#define ReactNativeConfigGenerated_h" >> "ReactNativeConfig/ReactNativeConfigGenerated.h"
echo "" >> "ReactNativeConfig/ReactNativeConfigGenerated.h"

for var in "${EXPORT_VARIABLES[@]}"; do
  echo "#define $var @\"$var\"" >> "ReactNativeConfig/ReactNativeConfigGenerated.h"
done

echo "" >> "ReactNativeConfig/ReactNativeConfigGenerated.h"
echo "#endif /* ReactNativeConfigGenerated_h */" >> "ReactNativeConfig/ReactNativeConfigGenerated.h"
