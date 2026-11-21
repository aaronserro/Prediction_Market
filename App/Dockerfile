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
FROM eclipse-temurin:17.0.17_10-jre-jammy

RUN apt-get update \
	&& apt-get install --no-install-recommends -y curl \
	&& rm -rf /var/lib/apt/lists/* \
	&& groupadd --system --gid 10001 app \
	&& useradd --system --uid 10001 --gid app --home-dir /nonexistent --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=build --chown=app:app /App/target/*.jar App.jar

ENV JAVA_TOOL_OPTIONS="-XX:InitialRAMPercentage=25 -XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.io.tmpdir=/tmp -Djava.security.egd=file:/dev/urandom"

VOLUME ["/tmp"]

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD curl --fail --silent --show-error http://127.0.0.1:8080/auth/csrf > /dev/null || exit 1

ENTRYPOINT ["java", "-jar", "/app/App.jar"]
