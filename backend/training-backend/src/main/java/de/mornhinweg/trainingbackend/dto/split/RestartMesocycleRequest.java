package de.mornhinweg.trainingbackend.dto.split;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestartMesocycleRequest {

  // The client's local date, which becomes the first day of week 1 (the server's date when null)
  private LocalDate startDate;
}
