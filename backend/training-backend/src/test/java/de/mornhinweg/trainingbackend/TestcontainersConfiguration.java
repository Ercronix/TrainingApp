package de.mornhinweg.trainingbackend;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Runs the tests against a throwaway Postgres in Docker (same image as production), so
 * `./gradlew test` needs no local database. Import it on every {@code @SpringBootTest}.
 * {@code @ServiceConnection} overrides the datasource URL, user and password.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

  @Bean
  @ServiceConnection
  PostgreSQLContainer postgresContainer() {
    return new PostgreSQLContainer("postgres:16-alpine");
  }
}
