package de.mornhinweg.trainingbackend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for the generated docs (spec at /api/docs/openapi.json, Swagger UI at /api/docs).
 * Every operation needs the bearer token unless it opts out with an empty {@code @SecurityRequirements}.
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "TrainingApp API",
        version = "v1",
        description = """
            REST API of TrainingApp, a fitness tracker for training splits, workout sessions, \
            progress stats and a daily stretching routine. Get an access token from \
            `POST /api/auth/login` (or `/register`) and use it with "Authorize". Access tokens are \
            short-lived; `POST /api/auth/refresh` exchanges the single-use refresh token for new ones."""),
    // Relative, so "Try it out" calls the host the docs were loaded from, directly or behind the proxy
    servers = @Server(url = "/"),
    security = @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH))
@SecurityScheme(
    name = OpenApiConfig.BEARER_AUTH,
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Access token from /api/auth/login, /register or /refresh")
public class OpenApiConfig {

  public static final String BEARER_AUTH = "bearerAuth";
}
