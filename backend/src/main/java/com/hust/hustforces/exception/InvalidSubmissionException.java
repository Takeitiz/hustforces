package com.hust.hustforces.exception;

public class InvalidSubmissionException extends RuntimeException {

    public InvalidSubmissionException(String message) {
        super(message);
    }

    public InvalidSubmissionException(String message, Throwable cause) {
        super(message, cause);
    }
}