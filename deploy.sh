#!/bin/bash

# 构建前端
echo "Building frontend..."
npm run build

# 构建 Docker 镜像
echo "Building Docker image..."
docker build -t 192.168.0.107:5000/english-learning:v1.3 .
#docker build --no-cache -t 192.168.0.107:5000/english-learning:v1.0 .

# 推送到私有仓库
echo "Pushing to private registry..."
docker push 192.168.0.107:5000/english-learning:v1.3

# docker rm -f english-learning
# docker run --restart=always -d -p 9001:80 --name english-learning 192.168.0.107:5000/english-learning:v1.3

# 使用 docker-compose 重新部署
echo "Deploying with docker-compose..."
#docker-compose down
#docker-compose up -d

echo "Deployment completed!"