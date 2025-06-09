package com.hust.hustforces.exception;

import lombok.Getter;

@Getter
public class RateLimitExceededException extends RuntimeException {

    private final String userId;
    private final int currentCount;

    public RateLimitExceededException(String userId, int currentCount) {
        super(String.format("Rate limit exceeded for user %s. Current count: %d", userId, currentCount));
        this.userId = userId;
        this.currentCount = currentCount;
    }

}