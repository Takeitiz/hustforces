import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { Loader2, Save, Play, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCodeSync } from '../../hooks/useCodeSync';
import useCodeRoomStore from '../../store/useCodeRoomStore';
import { LanguageId } from '../../types/codeRoom';

interface CollaborativeEditorProps {
    onSubmit?: () => void;
}

export function CollaborativeEditor({ onSubmit }: CollaborativeEditorProps) {
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<any[]>([]);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [copied, setCopied] = useState(false);

    const { room, currentUser, cursors, participants } = useCodeRoomStore();
    const {
        initializeEditor,
        currentCode,
        canEdit,
        forceSync,
        getDecoratedCode
    } = useCodeSync();

    // Handle editor mount
    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        setIsEditorReady(true);

        // Initialize code sync
        initializeEditor(editor);

        // Configure editor options
        editor.updateOptions({
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            fontFamily: "'Fira Code', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            readOnly: !canEdit,
            theme: 'vs-dark'
        });

        // Define custom styles for remote cursors
        monaco.editor.defineTheme('coderoom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {}
        });
        monaco.editor.setTheme('coderoom-dark');
    };

    // Update decorations for remote cursors
    useEffect(() => {
        if (!editorRef.current || !isEditorReady) return;

        const decorations = getDecoratedCode();

        // Apply decorations
        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            decorations
        );
    }, [cursors, getDecoratedCode, isEditorReady]);

    // Update read-only state when permissions change
    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            editorRef.current.updateOptions({
                readOnly: !canEdit
            });
        }
    }, [canEdit, isEditorReady]);

    // Handle copy code
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(currentCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy code:', error);
        }
    };

    // Get language config
    const getLanguageConfig = () => {
        if (!room) return { name: 'Text', monaco: 'plaintext' };

        switch (room.languageId) {
            case LanguageId.cpp:
                return { name: 'C++', monaco: 'cpp' };
            case LanguageId.java:
                return { name: 'Java', monaco: 'java' };
            case LanguageId.js:
                return { name: 'JavaScript', monaco: 'javascript' };
            case LanguageId.rs:
                return { name: 'Rust', monaco: 'rust' };
            default:
                return { name: 'Text', monaco: 'plaintext' };
        }
    };

    const languageConfig = getLanguageConfig();

    // Add cursor styles
    useEffect(() => {
        const styles: string[] = [];

        cursors.forEach((cursorInfo, userId) => {
            const participant = participants.get(userId);
            if (!participant || userId === currentUser?.userId) return;

            const color = cursorInfo.colorHex;

            // Cursor style
            styles.push(`
        .cursor-${userId}::after {
          content: '';
          position: absolute;
          width: 2px;
          height: 100%;
          background-color: ${color};
          animation: blink 1s infinite;
        }
        
        .cursor-${userId}::before {
          content: '${participant.username}';
          position: absolute;
          top: -20px;
          left: 0;
          background-color: ${color};
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 1000;
        }
        
        .selection-${userId} {
          background-color: ${color}33 !important;
        }
      `);
        });

        // Typing animation
        styles.push(`
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `);

        // Apply styles
        const styleElement = document.createElement('style');
        styleElement.textContent = styles.join('\n');
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, [cursors, participants, currentUser]);

    if (!room) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Language: <span className="text-white font-medium">{languageConfig.name}</span>
          </span>
                    {!canEdit && (
                        <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">
              Read Only
            </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={forceSync}
                        title="Force sync with server"
                        className="text-gray-400 hover:text-white"
                    >
                        <Save size={16} className="mr-1" />
                        Sync
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyCode}
                        className="text-gray-400 hover:text-white"
                    >
                        {copied ? (
                            <>
                                <Check size={16} className="mr-1" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={16} className="mr-1" />
                                Copy
                            </>
                        )}
                    </Button>

                    {onSubmit && canEdit && (
                        <Button
                            size="sm"
                            onClick={onSubmit}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play size={16} className="mr-1" />
                            Submit
                        </Button>
                    )}
                </div>
            </div>

            {/* Monaco Editor */}
            <div className={`flex-1 ${!isEditorReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                <MonacoEditor
                    language={languageConfig.monaco}
                    theme="vs-dark"
                    value={currentCode}
                    options={{
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: true },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        fontFamily: "'Fira Code', monospace",
                        fontLigatures: true,
                        readOnly: !canEdit
                    }}
                    editorDidMount={handleEditorDidMount}
                />
            </div>

            {/* Status Bar */}
            <div className="bg-gray-900 px-4 py-1 flex items-center justify-between border-t border-gray-800 text-xs">
                <div className="flex items-center gap-4 text-gray-400">
          <span>
            Ln {editorRef.current?.getPosition()?.lineNumber || 1},
            Col {editorRef.current?.getPosition()?.column || 1}
          </span>
                    <span>{currentCode.split('\n').length} lines</span>
                </div>

                <div className="flex items-center gap-2">
                    {Array.from(cursors.entries()).map(([userId, cursorInfo]) => {
                        const participant = participants.get(userId);
                        if (!participant || userId === currentUser?.userId) return null;

                        return (
                            <div
                                key={userId}
                                className="flex items-center gap-1 px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${cursorInfo.colorHex}20` }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: cursorInfo.colorHex }}
                                />
                                <span className="text-gray-300">
                  {participant.username} @ Ln {cursorInfo.position.line}
                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}