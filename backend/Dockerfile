# 1. Build Stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# 2. Runtime Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache bash mariadb-client \
    && addgroup -S budglee && adduser -S budglee -G budglee \
    && mkdir -p /backups && chown budglee:budglee /backups
USER budglee
COPY --from=build /app/target/*.jar app.jar
COPY --chown=budglee:budglee devops/scripts/backup.sh /opt/budglee/scripts/backup.sh
COPY --chown=budglee:budglee devops/scripts/restore.sh /opt/budglee/scripts/restore.sh
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
