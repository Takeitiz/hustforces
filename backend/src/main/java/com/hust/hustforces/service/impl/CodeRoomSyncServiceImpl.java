package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.model.dto.coderoom.CodeChangeDto;
import com.hust.hustforces.service.CodeRoomSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeRoomSyncServiceImpl implements CodeRoomSyncService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String ROOM_CODE_KEY = "coderoom:code:";
    private static final String ROOM_CHANGES_KEY = "coderoom:changes:";
    private static final String ROOM_VERSION_KEY = "coderoom:version:";
    private static final String ROOM_LOCK_KEY = "coderoom:lock:";
    private static final long ROOM_EXPIRY_HOURS = 24;

    @Override
    public void initializeRoom(String roomId, String initialCode) {
        log.info("Initializing sync for room: {}", roomId);

        ValueOperations<String, Object> ops = redisTemplate.opsForValue();

        // Store initial code
        ops.set(ROOM_CODE_KEY + roomId, initialCode, Duration.ofHours(ROOM_EXPIRY_HOURS));

        // Initialize version
        ops.set(ROOM_VERSION_KEY + roomId, 0L, Duration.ofHours(ROOM_EXPIRY_HOURS));

        // Initialize empty change list
        redisTemplate.delete(ROOM_CHANGES_KEY + roomId);
    }

    @Override
    public void applyChange(String roomId, CodeChangeDto change) {
        String lockKey = ROOM_LOCK_KEY + roomId;
        String codeKey = ROOM_CODE_KEY + roomId;
        String changesKey = ROOM_CHANGES_KEY + roomId;
        String versionKey = ROOM_VERSION_KEY + roomId;

        // Acquire distributed lock
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "locked", Duration.ofSeconds(5));

        if (Boolean.TRUE.equals(acquired)) {
            try {
                // Get current code
                String currentCode = (String) redisTemplate.opsForValue().get(codeKey);
                if (currentCode == null) {
                    log.error("Room {} not found in sync service", roomId);
                    return;
                }

                // Apply the change to the code
                String newCode = applyChangeToCode(currentCode, change);

                // Update code in Redis
                redisTemplate.opsForValue().set(codeKey, newCode, Duration.ofHours(ROOM_EXPIRY_HOURS));

                // Store change in history
                try {
                    String changeJson = objectMapper.writeValueAsString(change);
                    redisTemplate.opsForList().rightPush(changesKey, changeJson);
                    redisTemplate.expire(changesKey, Duration.ofHours(ROOM_EXPIRY_HOURS));
                } catch (JsonProcessingException e) {
                    log.error("Error serializing change", e);
                }

                // Increment version
                redisTemplate.opsForValue().increment(versionKey);

            } finally {
                // Release lock
                redisTemplate.delete(lockKey);
            }
        } else {
            log.warn("Could not acquire lock for room {}, retrying...", roomId);
            // In production, implement proper retry logic
            try {
                Thread.sleep(50);
                applyChange(roomId, change);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @Override
    public String getCurrentCode(String roomId) {
        String code = (String) redisTemplate.opsForValue().get(ROOM_CODE_KEY + roomId);
        return code != null ? code : "";
    }

    @Override
    public void cleanupRoom(String roomId) {
        log.info("Cleaning up sync data for room: {}", roomId);

        Set<String> keys = new HashSet<>();
        keys.add(ROOM_CODE_KEY + roomId);
        keys.add(ROOM_CHANGES_KEY + roomId);
        keys.add(ROOM_VERSION_KEY + roomId);
        keys.add(ROOM_LOCK_KEY + roomId);

        redisTemplate.delete(keys);
    }

    private String applyChangeToCode(String code, CodeChangeDto change) {
        // Convert code to list of lines for easier manipulation
        List<String> lines = new ArrayList<>(Arrays.asList(code.split("\n", -1)));

        switch (change.getOperation().toLowerCase()) {
            case "insert":
                return applyInsert(lines, change);

            case "delete":
                return applyDelete(lines, change);

            case "replace":
                return applyReplace(lines, change);

            default:
                log.warn("Unknown operation: {}", change.getOperation());
                return code;
        }
    }

    private String applyInsert(List<String> lines, CodeChangeDto change) {
        int startLine = change.getStartLine();
        int startColumn = change.getStartColumn();
        String text = change.getText();

        // Ensure we have enough lines
        while (lines.size() <= startLine) {
            lines.add("");
        }

        String line = lines.get(startLine);

        // Insert text at the specified position
        if (startColumn <= line.length()) {
            String newLine = line.substring(0, startColumn) + text + line.substring(startColumn);

            // Handle newlines in inserted text
            String[] insertedLines = newLine.split("\n", -1);
            lines.set(startLine, insertedLines[0]);

            for (int i = 1; i < insertedLines.length; i++) {
                lines.add(startLine + i, insertedLines[i]);
            }
        }

        return String.join("\n", lines);
    }

    private String applyDelete(List<String> lines, CodeChangeDto change) {
        int startLine = change.getStartLine();
        int startColumn = change.getStartColumn();
        int endLine = change.getEndLine();
        int endColumn = change.getEndColumn();

        if (startLine == endLine) {
            // Delete within single line
            if (startLine < lines.size()) {
                String line = lines.get(startLine);
                String newLine = line.substring(0, Math.min(startColumn, line.length())) +
                        line.substring(Math.min(endColumn, line.length()));
                lines.set(startLine, newLine);
            }
        } else {
            // Delete across multiple lines
            if (startLine < lines.size() && endLine < lines.size()) {
                String startLineText = lines.get(startLine);
                String endLineText = lines.get(endLine);

                String newLine = startLineText.substring(0, Math.min(startColumn, startLineText.length())) +
                        endLineText.substring(Math.min(endColumn, endLineText.length()));

                // Remove intermediate lines
                for (int i = endLine; i > startLine; i--) {
                    lines.remove(i);
                }

                lines.set(startLine, newLine);
            }
        }

        return String.join("\n", lines);
    }

    private String applyReplace(List<String> lines, CodeChangeDto change) {
        // Replace is delete + insert
        String afterDelete = applyDelete(lines, change);
        List<String> linesAfterDelete = new ArrayList<>(Arrays.asList(afterDelete.split("\n", -1)));

        // Adjust the change for insert operation
        CodeChangeDto insertChange = CodeChangeDto.builder()
                .operation("insert")
                .startLine(change.getStartLine())
                .startColumn(change.getStartColumn())
                .text(change.getText())
                .build();

        return applyInsert(linesAfterDelete, insertChange);
    }
}
