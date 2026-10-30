package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.CatalogExercise;
import de.mornhinweg.trainingbackend.repository.CatalogExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The photos of catalog exercises: a start (0) and an end (1) position. They are fetched from
 * free-exercise-db at the commit the catalog was seeded from, so clients only talk to this server,
 * and the most recent ones are kept in memory. Responses are cacheable for good, so a client asks
 * once per photo.
 */
@Service
@RequiredArgsConstructor
public class ExerciseImageService {

  // Same commit as backend/scripts/generate_exercise_catalog.py
  private static final String SOURCE =
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/";
  // About 70 KB each
  private static final int CACHED_IMAGES = 150;

  private final CatalogExerciseRepository catalogExerciseRepository;

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .followRedirects(HttpClient.Redirect.NORMAL)
      .build();

  private final Map<String, byte[]> cache = Collections.synchronizedMap(
      new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
          return size() > CACHED_IMAGES;
        }
      });

  public byte[] getImage(Long catalogExerciseId, int index) {
    if (index != 0 && index != 1) {
      throw new BadRequestException("Image index must be 0 or 1");
    }
    CatalogExercise exercise = catalogExerciseRepository.findById(catalogExerciseId)
        .filter(CatalogExercise::isHasImages)
        .orElseThrow(() -> new ResourceNotFoundException("Exercise image not found"));
    String path = URLEncoder.encode(exercise.getSlug(), StandardCharsets.UTF_8).replace("+", "%20") + "/" + index + ".jpg";
    byte[] cached = cache.get(path);
    if (cached != null) return cached;

    byte[] image = fetch(path);
    cache.put(path, image);
    return image;
  }

  private byte[] fetch(String path) {
    HttpRequest request = HttpRequest.newBuilder(URI.create(SOURCE + path))
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();
    try {
      HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
      if (response.statusCode() != 200) {
        throw new ResourceNotFoundException("Exercise image not found");
      }
      return response.body();
    } catch (IOException e) {
      throw new UncheckedIOException("Couldn't load exercise image " + path, e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Interrupted while loading exercise image " + path, e);
    }
  }
}
