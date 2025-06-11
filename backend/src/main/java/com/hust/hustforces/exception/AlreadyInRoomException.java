package com.hust.hustforces.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class AlreadyInRoomException extends RuntimeException {

    public AlreadyInRoomException(String message) {
        super(message);
    }

    public AlreadyInRoomException(String roomCode, String userId) {
        super(String.format("User %s is already an active participant in room %s", userId, roomCode));
    }
}