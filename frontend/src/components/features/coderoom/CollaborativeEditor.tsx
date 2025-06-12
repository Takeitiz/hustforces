import { useEffect, useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { Loader2, Save, Copy, Check } from 'lucide-react';
import useCodeRoomStore from "../../../contexts/CodeRoomContext.tsx";
import {useCodeSync} from "../../../hooks/useCodeSync.ts";
import {LanguageId} from "../../../types/codeRoom.ts";
import {Button} from "../../ui/Button.tsx";

interface CollaborativeEditorProps {}

export function CollaborativeEditor({}: CollaborativeEditorProps) {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<typeof monaco | null>(null);
    const disposablesRef = useRef<any[]>([]);
    const decorationsRef = useRef<any[]>([]);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [copied, setCopied] = useState(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    const { room, currentUser, cursors, participants, isConnected } = useCodeRoomStore();
    const {
        initializeEditor,
        currentCode,
        canEdit,
        forceSync,
        getDecoratedCode,
    } = useCodeSync();

    // Configure Monaco before editor mounts
    const configureMonaco = () => {
        if (!monacoRef.current) return;

        const monaco = monacoRef.current;

        // Define a custom theme with better cursor visibility
        monaco.editor.defineTheme('coderoom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                // Add syntax highlighting rules for better visibility
                { token: 'comment', foreground: '608B4E', fontStyle: 'italic' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'class', foreground: '4EC9B0' },
                { token: 'interface', foreground: '4EC9B0' },
                { token: 'namespace', foreground: '4EC9B0' },
                { token: 'parameter', foreground: '9CDCFE' },
                { token: 'property', foreground: '9CDCFE' },
                { token: 'constant', foreground: '4FC1FF' },
                { token: 'regexp', foreground: 'D16969' },
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#2A2A2A',
                'editorCursor.foreground': '#FFFFFF', // Bright white cursor
                'editorCursor.background': '#000000', // Black background for contrast
                'editor.selectionBackground': '#264F78',
                'editor.inactiveSelectionBackground': '#3A3D41',
                'editorWhitespace.foreground': '#3B3B3B',
                'editorIndentGuide.background': '#404040',
                'editorIndentGuide.activeBackground': '#707070',
            }
        });

        // Configure language-specific settings only if TypeScript is available
        try {
            if (monaco.languages && monaco.languages.typescript) {
                // Configure TypeScript/JavaScript defaults
                if (monaco.languages.typescript.javascriptDefaults) {
                    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                        noSemanticValidation: false,
                        noSyntaxValidation: false,
                    });

                    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                        target: monaco.languages.typescript.ScriptTarget.Latest,
                        allowNonTsExtensions: true,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        noEmit: true,
                        esModuleInterop: true,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        allowJs: true,
                        typeRoots: ["node_modules/@types"]
                    });

                    // Add some common type definitions for better IntelliSense
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(
                        `declare class Console {
                            log(...args: any[]): void;
                            error(...args: any[]): void;
                            warn(...args: any[]): void;
                            info(...args: any[]): void;
                            debug(...args: any[]): void;
                            trace(...args: any[]): void;
                            table(data: any): void;
                            time(label: string): void;
                            timeEnd(label: string): void;
                        }
                        declare var console: Console;
                        declare function setTimeout(callback: () => void, ms: number): number;
                        declare function setInterval(callback: () => void, ms: number): number;
                        declare function clearTimeout(id: number): void;
                        declare function clearInterval(id: number): void;
                        declare function alert(message: string): void;
                        declare function confirm(message: string): boolean;
                        declare function prompt(message: string, defaultValue?: string): string | null;`,
                        'ts:globals'
                    );
                }

                // Configure TypeScript defaults if available
                if (monaco.languages.typescript.typescriptDefaults) {
                    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                        noSemanticValidation: false,
                        noSyntaxValidation: false,
                    });
                }
            }
        } catch (error) {
            console.warn('[Monaco] Failed to configure TypeScript features:', error);
            // Continue without TypeScript features
        }

        // Register completion providers for all languages
        registerCompletionProviders(monaco);
    };

    // Register custom completion providers
    const registerCompletionProviders = (monaco: any) => {
        const languages = ['javascript', 'typescript', 'java', 'cpp', 'rust'];

        languages.forEach(language => {
            monaco.languages.registerCompletionItemProvider(language, {
                provideCompletionItems: (model: any, position: any) => {
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    };

                    // Language-specific suggestions
                    const suggestions = getLanguageSuggestions(language, range, monaco);

                    return {
                        suggestions: suggestions
                    };
                }
            });
        });
    };

    // Get language-specific suggestions
    const getLanguageSuggestions = (language: string, range: any, monaco: any) => {
        const commonSuggestions = [
            {
                label: 'console.log',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'console.log(${1:message});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Log output to console',
                range: range
            },
            {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function declaration',
                range: range
            },
            {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if (${1:condition}) {\n\t${2:// body}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement',
                range: range
            },
            {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// body}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop',
                range: range
            }
        ];

        // Add language-specific suggestions
        if (language === 'javascript' || language === 'typescript') {
            commonSuggestions.push(
                {
                    label: 'const',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'const ${1:name} = ${2:value};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Constant declaration',
                    range: range
                },
                {
                    label: 'arrow',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n};',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Arrow function',
                    range: range
                }
            );
        } else if (language === 'java') {
            commonSuggestions.push(
                {
                    label: 'sout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'System.out.println(${1:message});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print to console',
                    range: range
                },
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public static void main(String[] args) {\n\t${1:// body}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main method',
                    range: range
                }
            );
        } else if (language === 'cpp') {
            commonSuggestions.push(
                {
                    label: 'cout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'std::cout << ${1:message} << std::endl;',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print to console',
                    range: range
                },
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'int main() {\n\t${1:// body}\n\treturn 0;\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main function',
                    range: range
                }
            );
        }

        return commonSuggestions;
    };

    // Handle editor mount
    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setIsEditorReady(true);

        // Configure Monaco if not already done
        configureMonaco();

        // Clear any existing disposables
        disposablesRef.current.forEach(d => d?.dispose?.());
        disposablesRef.current = [];

        // Configure editor options with enhanced settings
        editor.updateOptions({
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            readOnly: !canEdit,
            theme: 'coderoom-dark',
            cursorStyle: 'block', // Make cursor more visible
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            scrollbar: {
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
            },
            // Enable IntelliSense and suggestions
            quickSuggestions: {
                other: true,
                comments: false,
                strings: true
            },
            parameterHints: {
                enabled: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'smart',
            tabCompletion: 'on',
            wordBasedSuggestions: true,
            suggestSelection: 'first',
            snippetSuggestions: 'inline',
            suggest: {
                snippetsPreventQuickSuggestions: false,
                showWords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showConstants: true,
                showKeywords: true,
                showModules: true,
            },
            // Enhanced cursor and selection visibility
            cursorWidth: 3,
            roundedSelection: false,
            mouseWheelZoom: true,
        });

        // Add keyboard shortcuts
        editor.addAction({
            id: 'trigger-suggest',
            label: 'Trigger Suggest',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
            ],
            run: () => {
                editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
            }
        });

        // Initialize code sync and store cleanup function
        cleanupRef.current = initializeEditor(editor);

        // Apply theme
        monaco.editor.setTheme('coderoom-dark');

        // Add custom CSS for even better cursor visibility
        const style = document.createElement('style');
        style.textContent = `
            .monaco-editor .cursor {
                background-color: #FFFFFF !important;
                width: 3px !important;
                animation: monaco-cursor-blink 1s steps(2) infinite !important;
            }
            
            @keyframes monaco-cursor-blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            .monaco-editor .cursors-layer > .cursor {
                box-shadow: 0 0 2px #FFFFFF, 0 0 10px #FFFFFF !important;
            }
            
            /* Enhanced selection visibility */
            .monaco-editor .selected-text {
                background-color: rgba(58, 112, 176, 0.5) !important;
            }
            
            /* Better line highlight */
            .monaco-editor .view-overlays .current-line {
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            /* Make suggestion widget more visible */
            .monaco-editor .suggest-widget {
                border: 1px solid #3B82F6 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            }
            
            .monaco-editor .suggest-widget .monaco-list-row.focused {
                background-color: #3B82F6 !important;
            }
        `;
        document.head.appendChild(style);

        // Store reference to remove on cleanup
        disposablesRef.current.push({
            dispose: () => {
                try {
                    document.head.removeChild(style);
                } catch (e) {
                    // Style might already be removed
                }
            }
        });

        // Trigger initial suggestions after a short delay
        setTimeout(() => {
            if (canEdit && editor) {
                editor.focus();
            }
        }, 500);
    };

    // Get language config with proper Monaco language IDs
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }

            disposablesRef.current.forEach(d => d?.dispose?.());
            disposablesRef.current = [];

            if (editorRef.current) {
                const model = editorRef.current.getModel();
                if (model) {
                    model.dispose();
                }
                editorRef.current.dispose();
                editorRef.current = null;
            }
        };
    }, []);

    // Update decorations for remote cursors
    useEffect(() => {
        if (!editorRef.current || !isEditorReady) return;

        try {
            const decorations = getDecoratedCode();
            decorationsRef.current = editorRef.current.deltaDecorations(
                decorationsRef.current,
                decorations
            );
        } catch (error) {
            console.error('Failed to update decorations:', error);
        }
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

    const languageConfig = getLanguageConfig();

    // Add cursor styles for remote users
    useEffect(() => {
        const styles: string[] = [];

        // Add enhanced remote cursor styles
        styles.push(`
            /* Remote cursor base styles */
            .monaco-editor .remote-cursor {
                position: absolute;
                pointer-events: none;
                z-index: 100;
            }
            
            /* Remote cursor line indicator */
            .monaco-editor .remote-cursor-line {
                position: absolute;
                width: 3px;
                background: linear-gradient(to bottom, 
                    var(--cursor-color) 0%, 
                    var(--cursor-color) 50%, 
                    transparent 100%);
                box-shadow: 
                    0 0 6px var(--cursor-color),
                    0 0 12px var(--cursor-color),
                    0 0 18px var(--cursor-color);
                animation: remote-cursor-pulse 1.5s ease-in-out infinite;
            }
            
            @keyframes remote-cursor-pulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scaleY(1);
                }
                50% { 
                    opacity: 0.6; 
                    transform: scaleY(0.95);
                }
            }
            
            /* Remote cursor label */
            .monaco-editor .remote-cursor-label {
                position: absolute;
                top: -24px;
                left: 0;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                color: white;
                white-space: nowrap;
                pointer-events: none;
                z-index: 101;
                box-shadow: 
                    0 2px 8px rgba(0, 0, 0, 0.3),
                    0 0 12px var(--cursor-color);
                animation: remote-cursor-label-appear 0.3s ease-out;
                backdrop-filter: blur(4px);
            }
            
            @keyframes remote-cursor-label-appear {
                from {
                    opacity: 0;
                    transform: translateY(4px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Remote selection */
            .monaco-editor .remote-selection {
                position: absolute;
                pointer-events: none;
                background-color: var(--selection-color);
                opacity: 0.3;
                border: 1px solid var(--cursor-color);
                box-shadow: inset 0 0 4px var(--cursor-color);
            }
        `);

        // Generate styles for each remote user
        cursors.forEach((cursorInfo, userId) => {
            const participant = participants.get(userId);
            if (!participant || userId === currentUser?.userId) return;

            const color = cursorInfo.colorHex;
            const lighterColor = adjustColorBrightness(color, 20); // Make color 20% brighter

            styles.push(`
                /* Cursor for user ${userId} */
                .cursor-${userId} {
                    --cursor-color: ${color};
                    --selection-color: ${color}40;
                }
                
                .cursor-${userId}::after {
                    content: '';
                    position: absolute;
                    width: 3px;
                    height: 1.2em;
                    background: linear-gradient(to bottom, 
                        ${lighterColor} 0%, 
                        ${color} 50%, 
                        ${color}80 100%);
                    box-shadow: 
                        0 0 6px ${color},
                        0 0 12px ${color},
                        0 0 18px ${color},
                        inset 0 0 4px rgba(255, 255, 255, 0.5);
                    animation: cursor-${userId}-blink 1s infinite;
                    border-radius: 1px;
                }
                
                @keyframes cursor-${userId}-blink {
                    0%, 45% { 
                        opacity: 1; 
                        transform: scaleX(1);
                    }
                    50%, 95% { 
                        opacity: 0.3; 
                        transform: scaleX(0.7);
                    }
                    100% { 
                        opacity: 1; 
                        transform: scaleX(1);
                    }
                }
                
                .cursor-${userId}::before {
                    content: '${participant.username}';
                    position: absolute;
                    top: -24px;
                    left: 0;
                    background: linear-gradient(135deg, ${color}F0, ${color}D0);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    z-index: 1000;
                    box-shadow: 
                        0 2px 8px rgba(0, 0, 0, 0.3),
                        0 0 12px ${color}80,
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                    border: 1px solid ${color}60;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
                
                .selection-${userId} {
                    background-color: ${color}25 !important;
                    border: 1px solid ${color}40 !important;
                    box-shadow: 
                        inset 0 0 8px ${color}20,
                        0 0 4px ${color}40 !important;
                }
                
                /* Highlight line where cursor is */
                .line-${userId} {
                    background-color: ${color}10 !important;
                    border-left: 2px solid ${color} !important;
                }
            `);
        });

        // Helper function to adjust color brightness
        function adjustColorBrightness(hex: string, percent: number): string {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16)
                .slice(1);
        }

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
                    {!isConnected && (
                        <span className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded">
                            Disconnected
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
                        disabled={!isConnected}
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
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: true,
                        readOnly: !canEdit,
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        tabCompletion: 'on',
                        cursorStyle: 'block',
                        cursorBlinking: 'blink',
                        cursorWidth: 3,
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
                    <span className="text-gray-500">
                        Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Space</kbd> for suggestions
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {Array.from(cursors.entries()).map(([userId, cursorInfo]) => {
                        const participant = participants.get(userId);
                        if (!participant || userId === currentUser?.userId) return null;

                        return (
                            <div
                                key={userId}
                                className="flex items-center gap-1 px-2 py-0.5 rounded backdrop-blur-sm"
                                style={{
                                    backgroundColor: `${cursorInfo.colorHex}20`,
                                    border: `1px solid ${cursorInfo.colorHex}40`
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{
                                        backgroundColor: cursorInfo.colorHex,
                                        boxShadow: `0 0 4px ${cursorInfo.colorHex}`
                                    }}
                                />
                                <span className="text-gray-300 font-medium">
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