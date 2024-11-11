#!/bin/bash

# 远程服务器信息
REMOTE_HOST="192.168.0.107"
REMOTE_USER=""
REMOTE_PATH="~"

# 构建前端
echo "Building frontend..."
npm run build

# 构建 Docker 镜像
echo "Building Docker image..."
docker build -t 192.168.0.107:5000/english-learning:v1.0 .

# 推送到私有仓库
echo "Pushing to private registry..."
docker push 192.168.0.107:5000/english-learning:v1.0

# 连接到远程服务器并部署
echo "Deploying to remote server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
    cd $REMOTE_PATH
    docker pull 192.168.0.107:5000/english-learning:v1.0
    docker-compose down
    docker-compose up -d
ENDSSH

echo "Remote deployment completed!"