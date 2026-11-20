package de.mornhinweg.trainingbackend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Duration;

/** A rate limit was hit; answered with 429 and a Retry-After header (see GlobalExceptionHandler). */
@Getter
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class TooManyRequestsException extends RuntimeException {

    private final Duration retryAfter;

    public TooManyRequestsException(Duration retryAfter) {
        super("Too many attempts, try again in " + describe(retryAfter));
        this.retryAfter = retryAfter;
    }

    /** Whole seconds for the Retry-After header, at least 1. */
    public long getRetryAfterSeconds() {
        return Math.max(1, (retryAfter.toMillis() + 999) / 1000);
    }

    private static String describe(Duration wait) {
        long seconds = Math.max(1, (wait.toMillis() + 999) / 1000);
        if (seconds < 60) {
            return seconds + (seconds == 1 ? " second" : " seconds");
        }
        long minutes = (seconds + 59) / 60;
        return minutes + (minutes == 1 ? " minute" : " minutes");
    }
}
