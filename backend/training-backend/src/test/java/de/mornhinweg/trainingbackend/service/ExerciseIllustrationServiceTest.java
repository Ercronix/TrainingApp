package de.mornhinweg.trainingbackend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExerciseIllustrationServiceTest {

  @Test
  void onlyPlainDrawingsAreServed() {
    assertTrue(ExerciseIllustrationService.isPlainDrawing(
        "<svg viewBox=\"0 0 10 10\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#333\"><path d=\"M0 0h10\"/></g></svg>"));

    assertFalse(ExerciseIllustrationService.isPlainDrawing("<svg><script>alert(1)</script></svg>"));
    assertFalse(ExerciseIllustrationService.isPlainDrawing("<svg><path onload=\"alert(1)\" d=\"M0 0\"/></svg>"));
    assertFalse(ExerciseIllustrationService.isPlainDrawing("<svg><image href=\"https://example.com/x.png\"/></svg>"));
    assertFalse(ExerciseIllustrationService.isPlainDrawing("<!DOCTYPE svg><svg></svg>"));
    assertFalse(ExerciseIllustrationService.isPlainDrawing("<html><svg></svg></html>"));
  }
}
