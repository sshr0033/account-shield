# Stage 1: Build the JAR using Maven + Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: Run the JAR using a lightweight Java 21 image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/account-shield-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]