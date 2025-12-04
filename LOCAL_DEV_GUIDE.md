# 로컬 개발 환경 실행 가이드

## 빠른 시작 (한 번에 모두 실행)

```bash
# 1. Docker 컨테이너 시작 (순서대로)
docker start asyncsite-mysql asyncsite-kafka asyncsite-redis asyncsite-eureka

# 잠시 대기 (Eureka가 먼저 올라와야 함)
sleep 10

# 2. 서비스 컨테이너 시작
docker start asyncsite-gateway asyncsite-user-service asyncsite-query-daily-service

# 3. 프론트엔드 시작
cd ~/async-site/study-platform-backoffice && npm run dev
```

## 개별 서비스 실행 명령어

### 인프라 서비스
```bash
docker start asyncsite-mysql       # MySQL (3306)
docker start asyncsite-kafka       # Kafka (9092)
docker start asyncsite-redis       # Redis (6379)
docker start asyncsite-eureka      # Eureka (8761)
```

### 애플리케이션 서비스
```bash
docker start asyncsite-gateway              # Gateway (8080)
docker start asyncsite-user-service         # User Service (8381)
docker start asyncsite-query-daily-service  # Query Daily Service (8387)
```

### 프론트엔드
```bash
cd ~/async-site/study-platform-backoffice
npm run dev
# http://localhost:5173/ 에서 접속
```

## 서비스 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| 백오피스 프론트엔드 | http://localhost:5173/ | 스터디 백오피스 UI |
| Eureka Dashboard | http://localhost:8761/ | 서비스 디스커버리 대시보드 |
| Gateway | http://localhost:8080 | API Gateway |
| User Service | http://localhost:8381 | 사용자 서비스 |
| Query Daily Service | http://localhost:8387 | 쿼리데일리 서비스 |

## 전체 종료

```bash
# 모든 asyncsite 컨테이너 종료
docker stop asyncsite-gateway asyncsite-user-service asyncsite-query-daily-service asyncsite-eureka asyncsite-redis asyncsite-kafka asyncsite-mysql

# 프론트엔드 종료
lsof -ti:5173 | xargs kill -9
```

## 로그 확인

```bash
docker logs -f asyncsite-gateway
docker logs -f asyncsite-user-service
docker logs -f asyncsite-query-daily-service
```

## 상태 확인

```bash
# 모든 asyncsite 컨테이너 상태 확인
docker ps -a | grep asyncsite

# Gateway 헬스체크
curl http://localhost:8080/actuator/health
```

## 문제 해결

### 컨테이너가 없는 경우 (첫 실행 또는 삭제된 경우)

인프라 컨테이너 생성:
```bash
# MySQL
docker run -d --name asyncsite-mysql \
  --network asyncsite-network \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=asyncsite_root_2024! \
  mysql:8.0

# Redis
docker run -d --name asyncsite-redis \
  --network asyncsite-network \
  -p 6379:6379 \
  redis:7-alpine

# Kafka
docker run -d --name asyncsite-kafka \
  --network asyncsite-network \
  -p 9092:9092 -p 29092:29092 \
  bitnami/kafka:3.7

# Eureka
docker run -d --name asyncsite-eureka \
  --network asyncsite-network \
  -p 8761:8761 \
  -e SPRING_PROFILES_ACTIVE=docker \
  asyncsite/eureka-server:latest
```

서비스 컨테이너 생성:
```bash
# Gateway
docker run -d --name asyncsite-gateway \
  --network asyncsite-network \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e SPRING_DATA_REDIS_HOST=asyncsite-redis \
  -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://asyncsite-eureka:8761/eureka/ \
  -e JWT_SECRET=asyncsite-jwt-secret-key-for-local-development-2024 \
  asyncsite/gateway:latest

# User Service
docker run -d --name asyncsite-user-service \
  --network asyncsite-network \
  -p 8381:8381 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e "SPRING_DATASOURCE_URL=jdbc:mysql://asyncsite-mysql:3306/userdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul" \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e "SPRING_DATASOURCE_PASSWORD=asyncsite_root_2024!" \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=asyncsite-kafka:9092 \
  -e SPRING_DATA_REDIS_HOST=asyncsite-redis \
  -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://asyncsite-eureka:8761/eureka/ \
  asyncsite/user-service:latest

# Query Daily Service
docker run -d --name asyncsite-query-daily-service \
  --network asyncsite-network \
  -p 8387:8387 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e "SPRING_DATASOURCE_URL=jdbc:mysql://asyncsite-mysql:3306/querydailydb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul" \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e "SPRING_DATASOURCE_PASSWORD=asyncsite_root_2024!" \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=asyncsite-kafka:9092 \
  -e SPRING_DATA_REDIS_HOST=asyncsite-redis \
  -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://asyncsite-eureka:8761/eureka/ \
  asyncsite/query-daily-service:latest
```
