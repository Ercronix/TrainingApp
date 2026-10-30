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
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The drawings of catalog exercises from Everkinetic (CC BY-SA 4.0): line art of a start (0) and
 * an end (1) pose, as SVG. They are fetched at the commit V19 was generated from, so clients only
 * talk to this server, and the most recent ones are kept in memory. Clients recolor and credit them.
 */
@Service
@RequiredArgsConstructor
public class ExerciseIllustrationService {

  // Same commit as backend/scripts/generate_exercise_illustrations.py
  private static final String SOURCE =
      "https://raw.githubusercontent.com/everkinetic/data/446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6/dist/svg/";
  private static final String[] POSES = {"relaxation", "tension"};
  // About 20 KB each
  private static final int CACHED_DRAWINGS = 200;
  private static final Pattern ILLUSTRATION_ID = Pattern.compile("\\d{4}");
  // The drawings are plain paths; anything else (scripts, links, embedded content) is refused
  private static final Pattern TAG = Pattern.compile("<\\s*/?\\s*([a-zA-Z:]+)");
  private static final Set<String> ALLOWED_TAGS = Set.of("svg", "g", "path");
  private static final Pattern UNSAFE = Pattern.compile("(?i)href|\\son\\w+\\s*=|javascript:|<!");

  private final CatalogExerciseRepository catalogExerciseRepository;

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .followRedirects(HttpClient.Redirect.NORMAL)
      .build();

  private final Map<String, String> cache = Collections.synchronizedMap(
      new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
          return size() > CACHED_DRAWINGS;
        }
      });

  public String getIllustration(Long catalogExerciseId, int index) {
    if (index != 0 && index != 1) {
      throw new BadRequestException("Illustration index must be 0 or 1");
    }
    String illustration = catalogExerciseRepository.findById(catalogExerciseId)
        .map(CatalogExercise::getIllustration)
        .filter(id -> ILLUSTRATION_ID.matcher(id).matches())
        .orElseThrow(() -> new ResourceNotFoundException("Exercise illustration not found"));
    String file = illustration + "-" + POSES[index] + ".svg";
    String cached = cache.get(file);
    if (cached != null) return cached;

    String svg = fetch(file);
    if (!isPlainDrawing(svg)) {
      throw new IllegalStateException("Exercise illustration " + file + " isn't a plain drawing");
    }
    cache.put(file, svg);
    return svg;
  }

  static boolean isPlainDrawing(String svg) {
    if (!svg.stripLeading().startsWith("<svg") || UNSAFE.matcher(svg).find()) return false;
    Matcher tags = TAG.matcher(svg);
    while (tags.find()) {
      if (!ALLOWED_TAGS.contains(tags.group(1))) return false;
    }
    return true;
  }

  private String fetch(String file) {
    HttpRequest request = HttpRequest.newBuilder(URI.create(SOURCE + file))
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();
    try {
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        throw new ResourceNotFoundException("Exercise illustration not found");
      }
      return response.body();
    } catch (IOException e) {
      throw new UncheckedIOException("Couldn't load exercise illustration " + file, e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Interrupted while loading exercise illustration " + file, e);
    }
  }
}
