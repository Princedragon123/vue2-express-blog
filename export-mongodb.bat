#!/bin/bash

# ============================================================
# MongoDB 数据导出脚本 - BlogLogin 项目
# ============================================================
# 【用途】一键导出所有集合数据
# 【格式】JSON 格式（易读、易迁移）
# 【输出】./export/ 目录
# ============================================================

# 配置
DB_HOST="localhost"
DB_PORT="27017"
DB_NAME="bloglogin"
EXPORT_DIR="./export_$(date +%Y%m%d_%H%M%S)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "🐱 MongoDB 数据导出工具 - BlogLogin 项目"
echo "========================================"
echo ""

# 创建导出目录
mkdir -p "$EXPORT_DIR"
echo -e "${YELLOW}📁 创建导出目录：$EXPORT_DIR${NC}"

# 导出函数
export_collection() {
  local collection=$1
  local output_file="$EXPORT_DIR/${collection}.json"
  
  echo -e "${YELLOW}正在导出集合：$collection${NC}"
  
  mongoexport --host $DB_HOST --port $DB_PORT \
    --db $DB_NAME \
    --collection $collection \
    --out $output_file \
    --pretty
  
  if [ $? -eq 0 ]; then
    count=$(jq length "$output_file" 2>/dev/null || echo "未知")
    echo -e "${GREEN}✅ 已导出：$collection ($count 条数据)${NC}"
  else
    echo -e "${RED}❌ 导出失败：$collection${NC}"
  fi
  
  echo ""
}

# 导出所有集合
echo "开始导出数据..."
echo ""

export_collection "users"
export_collection "blogs"
export_collection "messages"
export_collection "notifications"
export_collection "comments"
export_collection "topics"
export_collection "follows"

# 创建导出说明文件
cat > "$EXPORT_DIR/README.md" << EOF
# MongoDB 数据导出

**导出时间：** $(date '+%Y-%m-%d %H:%M:%S')
**数据库：** $DB_NAME
**主机：** $DB_HOST:$DB_PORT

## 文件列表

$(ls -1 $EXPORT_DIR/*.json | xargs -n1 basename)

## 导入方法

\`\`\`bash
# 导入单个集合
mongoimport --host $DB_HOST --port $DB_PORT \
  --db $DB_NAME \
  --collection <集合名> \
  --file <文件名.json>

# 示例：导入 users
mongoimport --host $DB_HOST --port $DB_PORT \
  --db $DB_NAME \
  --collection users \
  --file users.json
\`\`\`

## 注意事项

1. 确保 MongoDB 服务正在运行
2. 确保有足够权限访问数据库
3. 敏感数据请妥善保管
EOF

echo ""
echo "========================================"
echo "✅ 导出完成！"
echo "========================================"
echo ""
echo -e "${GREEN}📁 导出目录：$EXPORT_DIR${NC}"
echo ""
echo "查看导出文件："
echo "  ls -lh $EXPORT_DIR"
echo ""
echo "导入数据示例："
echo "  mongoimport --host $DB_HOST --port $DB_PORT --db $DB_NAME --collection users --file $EXPORT_DIR/users.json"
echo ""
