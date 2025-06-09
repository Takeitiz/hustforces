package com.hust.hustforces.exception;

import lombok.Getter;

@Getter
public class ContestNotActiveException extends RuntimeException {

    private final String contestId;

    public ContestNotActiveException(String contestId) {
        super(String.format("Contest %s is not active", contestId));
        this.contestId = contestId;
    }

}
