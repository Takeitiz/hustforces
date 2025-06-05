import { useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import useCodeRoomStore from '../store/useCodeRoomStore';
import codeRoomWebSocketService from '../service/codeRoomWebSocketService';
import { CodeChangeDto, CursorPositionDto } from '../types/codeRoom';

interface CodeSyncOptions {
    debounceDelay?: number;
    batchChanges?: boolean;
}

export function useCodeSync(options: CodeSyncOptions = {}) {
    const {
        debounceDelay = 50,
        batchChanges = true
    } = options;

    const {
        currentCode,
        currentUser,
        canEdit,
        setCurrentCode,
        updateCursor,
        removeCursor,
        setUserTyping
    } = useCodeRoomStore();

    // Refs for managing state
    const editorRef = useRef<any>(null);
    const changeQueueRef = useRef<CodeChangeDto[]>([]);
    const isApplyingRemoteChange = useRef(false);
    const lastCursorPosition = useRef<CursorPositionDto | null>(null);

    // Apply remote code change to editor
    const applyRemoteChange = useCallback((change: CodeChangeDto) => {
        if (!editorRef.current || !change.userId || change.userId === currentUser?.userId) {
            return;
        }

        isApplyingRemoteChange.current = true;

        try {
            const model = editorRef.current.getModel();
            if (!model) return;

            const { operation, startLine, startColumn, endLine, endColumn, text } = change;

            switch (operation) {
                case 'insert':
                    model.pushEditOperations(
                        [],
                        [{
                            range: {
                                startLineNumber: startLine,
                                startColumn: startColumn,
                                endLineNumber: startLine,
                                endColumn: startColumn
                            },
                            text: text
                        }],
                        () => null
                    );
                    break;

                case 'delete':
                    model.pushEditOperations(
                        [],
                        [{
                            range: {
                                startLineNumber: startLine,
                                startColumn: startColumn,
                                endLineNumber: endLine,
                                endColumn: endColumn
                            },
                            text: ''
                        }],
                        () => null
                    );
                    break;

                case 'replace':
                    model.pushEditOperations(
                        [],
                        [{
                            range: {
                                startLineNumber: startLine,
                                startColumn: startColumn,
                                endLineNumber: endLine,
                                endColumn: endColumn
                            },
                            text: text
                        }],
                        () => null
                    );
                    break;
            }

            // Update local code state
            setCurrentCode(model.getValue());
        } finally {
            isApplyingRemoteChange.current = false;
        }
    }, [currentUser, setCurrentCode]);

    // Send code change to server
    const sendCodeChange = useCallback((change: CodeChangeDto) => {
        if (!canEdit() || isApplyingRemoteChange.current) {
            return;
        }

        if (batchChanges) {
            changeQueueRef.current.push(change);
        } else {
            codeRoomWebSocketService.sendCodeChange(change);
        }
    }, [canEdit, batchChanges]);

    // Batch send changes
    const flushChangeQueue = useCallback(() => {
        if (changeQueueRef.current.length === 0) return;

        // Send all queued changes
        changeQueueRef.current.forEach(change => {
            codeRoomWebSocketService.sendCodeChange(change);
        });

        // Clear queue
        changeQueueRef.current = [];
    }, []);

    // Debounced flush
    const debouncedFlush = useRef(
        debounce(flushChangeQueue, debounceDelay)
    ).current;

    // Handle local code changes
    const handleContentChange = useCallback((value: string, event: any) => {
        if (!editorRef.current || isApplyingRemoteChange.current) {
            return;
        }

        setCurrentCode(value);

        // Don't send changes if user can't edit
        if (!canEdit()) {
            return;
        }

        // Convert Monaco change event to our format
        event.changes.forEach((change: any) => {
            const codeChange: CodeChangeDto = {
                operation: change.text ? (change.rangeLength > 0 ? 'replace' : 'insert') : 'delete',
                startLine: change.range.startLineNumber,
                startColumn: change.range.startColumn,
                endLine: change.range.endLineNumber,
                endColumn: change.range.endColumn,
                text: change.text || ''
            };

            sendCodeChange(codeChange);
        });

        // Trigger batched send if enabled
        if (batchChanges) {
            debouncedFlush();
        }

        // Send typing indicator
        handleTypingIndicator(true);
    }, [canEdit, setCurrentCode, sendCodeChange, batchChanges, debouncedFlush]);

    // Handle cursor position changes
    const handleCursorChange = useCallback((event: any) => {
        if (!editorRef.current || !currentUser) {
            return;
        }

        const position = event.position;
        const selection = event.selection;

        const cursorPosition: CursorPositionDto = {
            line: position.lineNumber,
            column: position.column,
            selectionStartLine: selection.startLineNumber,
            selectionStartColumn: selection.startColumn,
            selectionEndLine: selection.endLineNumber,
            selectionEndColumn: selection.endColumn
        };

        // Only send if position actually changed
        if (
            !lastCursorPosition.current ||
            lastCursorPosition.current.line !== cursorPosition.line ||
            lastCursorPosition.current.column !== cursorPosition.column ||
            lastCursorPosition.current.selectionStartLine !== cursorPosition.selectionStartLine ||
            lastCursorPosition.current.selectionStartColumn !== cursorPosition.selectionStartColumn ||
            lastCursorPosition.current.selectionEndLine !== cursorPosition.selectionEndLine ||
            lastCursorPosition.current.selectionEndColumn !== cursorPosition.selectionEndColumn
        ) {
            lastCursorPosition.current = cursorPosition;
            codeRoomWebSocketService.sendCursorPosition(cursorPosition);
        }
    }, [currentUser]);

    // Handle typing indicator
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTypingIndicator = useCallback((isTyping: boolean) => {
        if (!currentUser) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (isTyping) {
            // Send typing status
            codeRoomWebSocketService.sendTypingStatus(true);

            // Set timeout to clear typing status
            typingTimeoutRef.current = setTimeout(() => {
                codeRoomWebSocketService.sendTypingStatus(false);
            }, 3000);
        } else {
            codeRoomWebSocketService.sendTypingStatus(false);
        }
    }, [currentUser]);

    // Set up WebSocket listeners for code sync
    useEffect(() => {
        const setupListeners = async () => {
            // Listen for code changes
            await codeRoomWebSocketService.onCodeChange((change) => {
                applyRemoteChange(change);
            });

            // Listen for cursor updates
            await codeRoomWebSocketService.onCursorUpdate((event) => {
                if (event.userId !== currentUser?.userId) {
                    updateCursor(event.userId, event.position, event.colorHex);
                }
            });

            // Listen for typing indicators
            await codeRoomWebSocketService.onTypingIndicator((event) => {
                if (event.userId !== currentUser?.userId) {
                    setUserTyping(event.userId, event.isTyping);
                }
            });
        };

        if (codeRoomWebSocketService.isConnected()) {
            setupListeners();
        }

        // Cleanup
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            debouncedFlush.cancel();
        };
    }, [currentUser, applyRemoteChange, updateCursor, setUserTyping, debouncedFlush]);

    // Initialize editor reference
    const initializeEditor = useCallback((editor: any) => {
        editorRef.current = editor;

        // Set up change listener
        editor.onDidChangeModelContent((event: any) => {
            handleContentChange(editor.getValue(), event);
        });

        // Set up cursor listener
        editor.onDidChangeCursorPosition(handleCursorChange);

        // Set up selection listener
        editor.onDidChangeCursorSelection(handleCursorChange);

        // Make editor read-only if user can't edit
        editor.updateOptions({
            readOnly: !canEdit()
        });
    }, [canEdit, handleContentChange, handleCursorChange]);

    // Sync editor options when permissions change
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({
                readOnly: !canEdit()
            });
        }
    }, [canEdit]);

    // Force sync
    const forceSync = useCallback(async () => {
        try {
            await codeRoomWebSocketService.requestSync();
        } catch (error) {
            console.error('Failed to sync:', error);
        }
    }, []);

    // Get decorated code with cursor positions
    const getDecoratedCode = useCallback(() => {
        if (!editorRef.current) return [];

        const decorations: any[] = [];
        const cursors = useCodeRoomStore.getState().cursors;

        cursors.forEach((cursorInfo, userId) => {
            if (userId === currentUser?.userId) return;

            const { position, colorHex } = cursorInfo;
            const participant = useCodeRoomStore.getState().participants.get(userId);

            if (!participant) return;

            // Cursor decoration
            decorations.push({
                range: {
                    startLineNumber: position.line,
                    startColumn: position.column,
                    endLineNumber: position.line,
                    endColumn: position.column
                },
                options: {
                    className: 'remote-cursor',
                    afterContentClassName: 'remote-cursor-after',
                    hoverMessage: { value: participant.username },
                    stickiness: 1,
                    zIndex: 100,
                    // Custom CSS will use the color
                    inlineClassName: `cursor-${userId}`,
                }
            });

            // Selection decoration if exists
            if (
                position.selectionStartLine &&
                position.selectionStartColumn &&
                position.selectionEndLine &&
                position.selectionEndColumn
            ) {
                decorations.push({
                    range: {
                        startLineNumber: position.selectionStartLine,
                        startColumn: position.selectionStartColumn,
                        endLineNumber: position.selectionEndLine,
                        endColumn: position.selectionEndColumn
                    },
                    options: {
                        className: 'remote-selection',
                        // Custom CSS will use the color with opacity
                        inlineClassName: `selection-${userId}`,
                    }
                });
            }
        });

        return decorations;
    }, [currentUser]);

    return {
        // Editor setup
        initializeEditor,

        // State
        currentCode,
        canEdit: canEdit(),

        // Actions
        forceSync,
        handleTypingIndicator,

        // Decorations
        getDecoratedCode,

        // Direct access to editor ref if needed
        editorRef
    };
}