package com.hust.hustforces.enums;

public enum CodeRoomStatus {
    ACTIVE,      // Room is active and accepting participants
    LOCKED,      // Room is locked, no new participants
    COMPLETED,   // Session completed normally
    ABANDONED    // Room was abandoned/closed without completion
}
