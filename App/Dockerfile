# ================================
# 1. Build stage
# ================================
FROM maven:3.9.4-eclipse-temurin-17 AS build

WORKDIR /App

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ================================
# 2. Run stage
# ================================
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /App/target/*.jar App.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "App.jar"]
