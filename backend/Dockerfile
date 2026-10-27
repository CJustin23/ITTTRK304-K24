# 1. Build Stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# 2. Runtime Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S budglee && adduser -S budglee -G budglee
USER budglee
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
