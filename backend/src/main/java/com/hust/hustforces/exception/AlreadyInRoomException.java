package com.hust.hustforces.exception;

public class AlreadyInRoomException extends RuntimeException {

    public AlreadyInRoomException(String message) {
        super(message);
    }

    public AlreadyInRoomException(String roomCode, String userId) {
        super(String.format("User %s is already an active participant in room %s", userId, roomCode));
    }
}