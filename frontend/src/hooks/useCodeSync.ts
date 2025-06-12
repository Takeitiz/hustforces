import { useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import useCodeRoomStore from '../contexts/CodeRoomContext';
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
        setUserTyping,
        cursors,
        participants
    } = useCodeRoomStore();

    // Refs for managing state
    const editorRef = useRef<any>(null);
    const changeQueueRef = useRef<CodeChangeDto[]>([]);
    const isApplyingRemoteChange = useRef(false);
    const lastCursorPosition = useRef<CursorPositionDto | null>(null);
    const hasSetupListeners = useRef(false);

    // Cursor position adjustment logic
    const adjustCursorPosition = (
        position: CursorPositionDto,
        change: CodeChangeDto
    ): CursorPositionDto => {
        const { line, column } = position;
        const { operation, startLine, startColumn, endLine, endColumn, text } = change;

        let newLine = line;
        let newColumn = column;

        if (operation === 'insert') {
            if (line > startLine || (line === startLine && column >= startColumn)) {
                const lines = text.split('\n');
                const linesDelta = lines.length - 1;

                if (line === startLine) {
                    if (linesDelta === 0) {
                        // Single line insert
                        newColumn = column + lines[0].length;
                    } else {
                        // Multi-line insert
                        newLine = line + linesDelta;
                        newColumn = lines[lines.length - 1].length + (column - startColumn);
                    }
                } else {
                    newLine = line + linesDelta;
                }
            }
        } else if (operation === 'delete' || operation === 'replace') {
            if (line > endLine || (line === endLine && column > endColumn)) {
                const linesDelta = endLine - startLine;

                if (line === endLine) {
                    newColumn = startColumn + (column - endColumn);
                    newLine = startLine;
                } else {
                    newLine = line - linesDelta;
                }
            } else if (line > startLine || (line === startLine && column > startColumn)) {
                // Cursor is within deleted range
                newLine = startLine;
                newColumn = startColumn;
            }

            // Handle replace by adding inserted text
            if (operation === 'replace' && text) {
                const lines = text.split('\n');
                const linesDelta = lines.length - 1;

                if (newLine === startLine) {
                    if (linesDelta === 0) {
                        newColumn = startColumn + lines[0].length;
                    } else {
                        newLine = startLine + linesDelta;
                        newColumn = lines[lines.length - 1].length;
                    }
                } else {
                    newLine = newLine + linesDelta;
                }
            }
        }

        return {
            ...position,
            line: Math.max(1, newLine),
            column: Math.max(1, newColumn)
        };
    };

    // Apply remote code change to editor
    const applyRemoteChange = useCallback((change: CodeChangeDto) => {
        if (!editorRef.current || !change.userId || change.userId === currentUser?.userId) {
            return;
        }

        isApplyingRemoteChange.current = true;

        try {
            const model = editorRef.current.getModel();
            if (!model) return;

            // Store current cursor positions
            const cursorAdjustments: Array<{ userId: string; newPosition: CursorPositionDto; color: string }> = [];

            cursors.forEach((cursorInfo, userId) => {
                if (userId !== change.userId) {
                    const adjustedPosition = adjustCursorPosition(cursorInfo.position, change);
                    cursorAdjustments.push({
                        userId,
                        newPosition: adjustedPosition,
                        color: cursorInfo.colorHex
                    });
                }
            });

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

            // Apply cursor adjustments
            cursorAdjustments.forEach(({ userId, newPosition, color }) => {
                updateCursor(userId, newPosition, color);
            });

            // Update local code state
            setCurrentCode(model.getValue());
        } finally {
            isApplyingRemoteChange.current = false;
        }
    }, [currentUser, setCurrentCode, cursors, updateCursor]);

    // Send code change to server
    const sendCodeChange = useCallback((change: CodeChangeDto) => {
        if (!canEdit() || isApplyingRemoteChange.current) {
            return;
        }

        if (batchChanges) {
            changeQueueRef.current.push(change);
        } else {
            // Try to send immediately if connected
            if (codeRoomWebSocketService.isConnected()) {
                codeRoomWebSocketService.sendCodeChange(change).catch(error => {
                    console.error('Failed to send code change:', error);
                    // Queue for retry
                    changeQueueRef.current.push(change);
                });
            } else {
                // Queue if not connected
                changeQueueRef.current.push(change);
            }
        }
    }, [canEdit, batchChanges]);

    // Batch send changes
    const flushChangeQueue = useCallback(() => {
        if (changeQueueRef.current.length === 0) return;

        // Check WebSocket connection
        if (!codeRoomWebSocketService.isConnected()) {
            console.warn('WebSocket not connected, cannot flush changes');
            return;
        }

        // Send all queued changes
        changeQueueRef.current.forEach(change => {
            codeRoomWebSocketService.sendCodeChange(change).catch(error => {
                console.error('Failed to send queued change:', error);
            });
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
        if (event && event.changes) {
            event.changes.forEach((change: any) => {
                // Ensure we have valid range data
                if (!change.range) {
                    console.warn('Invalid change event - no range:', change);
                    return;
                }

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
        }

        // Send typing indicator
        handleTypingIndicator(true);
    }, [canEdit, setCurrentCode, sendCodeChange, batchChanges, debouncedFlush]);

    // Handle cursor position changes
    const handleCursorChange = useCallback((event: any) => {
        if (!editorRef.current || !currentUser) {
            return;
        }

        // Monaco editor provides different event types for position and selection changes
        let position: any;
        let selection: any;

        // Handle cursor position change event
        if (event && event.position) {
            position = event.position;
            // For position change events, get selection from editor
            const selections = editorRef.current.getSelections();
            selection = selections && selections.length > 0 ? selections[0] : null;
        }
        // Handle selection change event
        else if (event && event.selection) {
            selection = event.selection;
            position = selection.getStartPosition();
        }
        // If neither, try to get from editor directly
        else {
            position = editorRef.current.getPosition();
            const selections = editorRef.current.getSelections();
            selection = selections && selections.length > 0 ? selections[0] : null;
        }

        if (!position) {
            return;
        }

        const cursorPosition: CursorPositionDto = {
            line: position.lineNumber || 1,
            column: position.column || 1,
            selectionStartLine: selection ? selection.startLineNumber : position.lineNumber || 1,
            selectionStartColumn: selection ? selection.startColumn : position.column || 1,
            selectionEndLine: selection ? selection.endLineNumber : position.lineNumber || 1,
            selectionEndColumn: selection ? selection.endColumn : position.column || 1
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

            // Check WebSocket connection before sending
            if (codeRoomWebSocketService.isConnected()) {
                codeRoomWebSocketService.sendCursorPosition(cursorPosition).catch(error => {
                    console.error('Failed to send cursor position:', error);
                });
            }
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

        // Check WebSocket connection
        if (!codeRoomWebSocketService.isConnected()) {
            return;
        }

        if (isTyping) {
            // Send typing status
            codeRoomWebSocketService.sendTypingStatus(true).catch(error => {
                console.error('Failed to send typing status:', error);
            });

            // Set timeout to clear typing status
            typingTimeoutRef.current = setTimeout(() => {
                if (codeRoomWebSocketService.isConnected()) {
                    codeRoomWebSocketService.sendTypingStatus(false).catch(error => {
                        console.error('Failed to clear typing status:', error);
                    });
                }
            }, 3000);
        } else {
            codeRoomWebSocketService.sendTypingStatus(false).catch(error => {
                console.error('Failed to send typing status:', error);
            });
        }
    }, [currentUser]);

    // Set up WebSocket listeners for code sync
    useEffect(() => {
        // Only set up listeners once when connected and user is set
        if (!codeRoomWebSocketService.isConnected() || !currentUser || hasSetupListeners.current) {
            return;
        }

        const setupListeners = async () => {
            try {
                console.log('[CodeSync] Setting up WebSocket listeners');
                hasSetupListeners.current = true;

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

                // Flush any queued changes
                if (changeQueueRef.current.length > 0) {
                    console.log(`[CodeSync] Flushing ${changeQueueRef.current.length} queued changes`);
                    flushChangeQueue();
                }
            } catch (error) {
                console.error('[CodeSync] Failed to setup WebSocket listeners:', error);
                hasSetupListeners.current = false;
            }
        };

        setupListeners();

        // Cleanup
        return () => {
            // Don't reset hasSetupListeners here as we want to keep the listeners
            // They will be cleaned up when the WebSocket disconnects

            // Cancel any pending debounced calls
            if (debouncedFlush) {
                debouncedFlush.cancel();
            }

            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }

            // Send final typing status if connected
            if (currentUser && codeRoomWebSocketService.isConnected()) {
                codeRoomWebSocketService.sendTypingStatus(false).catch(() => {
                    // Ignore errors during cleanup
                });
            }

            // Clear change queue
            changeQueueRef.current = [];
        };
    }, [currentUser?.userId]); // Only depend on user id

    // Reset listeners flag when disconnected
    useEffect(() => {
        const checkConnection = () => {
            const isConnected = codeRoomWebSocketService.isConnected();
            if (!isConnected && hasSetupListeners.current) {
                hasSetupListeners.current = false;
                console.log('[CodeSync] WebSocket disconnected, resetting listeners flag');
            }
        };

        // Check immediately
        checkConnection();

        // Check periodically
        const interval = setInterval(checkConnection, 1000);

        return () => clearInterval(interval);
    }, []);

    // Initialize editor reference
    const initializeEditor = useCallback((editor: any) => {
        editorRef.current = editor;

        // Set up change listener
        const changeDisposable = editor.onDidChangeModelContent((event: any) => {
            handleContentChange(editor.getValue(), event);
        });

        // Set up cursor listener
        const cursorDisposable = editor.onDidChangeCursorPosition(handleCursorChange);

        // Set up selection listener
        const selectionDisposable = editor.onDidChangeCursorSelection(handleCursorChange);

        // Make editor read-only if user can't edit
        editor.updateOptions({
            readOnly: !canEdit()
        });

        // Return cleanup function
        return () => {
            changeDisposable.dispose();
            cursorDisposable.dispose();
            selectionDisposable.dispose();
        };
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
            if (codeRoomWebSocketService.isConnected()) {
                await codeRoomWebSocketService.requestSync();
            } else {
                console.warn('Cannot sync - WebSocket not connected');
            }
        } catch (error) {
            console.error('Failed to sync:', error);
        }
    }, []);

    // Get decorated code with cursor positions
    const getDecoratedCode = useCallback(() => {
        if (!editorRef.current) return [];

        const decorations: any[] = [];

        cursors.forEach((cursorInfo, userId) => {
            if (userId === currentUser?.userId) return;

            const { position } = cursorInfo;
            const participant = participants.get(userId);

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
                        inlineClassName: `selection-${userId}`,
                    }
                });
            }
        });

        return decorations;
    }, [currentUser, cursors, participants]);

    return {
        // Editor setup
        initializeEditor,

        // State
        currentCode,
        canEdit: canEdit(),

        // Actions
        forceSync,

        // Decorations
        getDecoratedCode,
    };
}