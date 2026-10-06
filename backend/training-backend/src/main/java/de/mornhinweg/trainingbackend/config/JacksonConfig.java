package de.mornhinweg.trainingbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.module.SimpleModule;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Timestamps are UTC (see {@link de.mornhinweg.trainingbackend.TrainingBackendApplication}), so
 * they are written with a "Z": without it, clients read them as their own local time.
 */
@Configuration
public class JacksonConfig {

  @Bean
  public JacksonModule utcTimestampsModule() {
    SimpleModule module = new SimpleModule("UtcTimestamps");
    module.addSerializer(LocalDateTime.class, new ValueSerializer<>() {
      @Override
      public void serialize(LocalDateTime value, JsonGenerator gen, SerializationContext ctxt) {
        gen.writeString(value.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z");
      }
    });
    return module;
  }
}
