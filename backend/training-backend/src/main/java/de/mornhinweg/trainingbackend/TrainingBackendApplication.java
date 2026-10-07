package de.mornhinweg.trainingbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class TrainingBackendApplication {

  // LocalDateTime.now() and the stored timestamps are UTC whatever the host's zone, and are sent
  // with a "Z" (JacksonConfig); clients convert to their own zone. Static, so tests get it too.
  static {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
  }

  public static void main(String[] args) {
    SpringApplication.run(TrainingBackendApplication.class, args);
  }

}
