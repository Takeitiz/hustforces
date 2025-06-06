"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, Database } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Problem } from "../../../types/problem"
import type { TestCase } from "../../../service/adminService"
import problemService from "../../../service/problemService"

interface ProblemStatementProps {
    problem: Problem
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
    const [examples, setExamples] = useState<TestCase[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchExamples = async () => {
            setLoading(true)
            try {
                const fetchedExamples = await problemService.getProblemExamples(problem.slug);
                setExamples(fetchedExamples);
            } catch (error) {
                console.error("Failed to fetch examples:", error)
                setExamples([]);
            } finally {
                setLoading(false)
            }
        }

        fetchExamples()
    }, [problem.slug])

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case "EASY":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            case "HARD":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    // Custom components for ReactMarkdown
    const components = {
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md my-4"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                </code>
            )
        },
        pre({ children }: any) {
            return <div className="my-4">{children}</div>
        },
        h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>,
        p: ({ children }: any) => <p className="mb-4 leading-relaxed">{children}</p>,
        ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
        li: ({ children }: any) => <li className="ml-4">{children}</li>,
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
                {children}
            </blockquote>
        ),
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{problem.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock size={14} />
                            <span>{problem.timeLimit || 1}s</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Database size={14} />
                            <span>{problem.memoryLimit || 256}MB</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                >
                    {problem.description}
                </ReactMarkdown>
            </div>

            {/* Show examples section if we have examples */}
            {!loading && examples.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Examples</h2>
                    <div className="space-y-6">
                        {examples.map((example, index) => (
                            <div key={example.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Example {index + 1}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                                        <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-md overflow-x-auto font-mono text-sm border border-gray-200 dark:border-gray-700">
                                {example.input}
                            </pre>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</div>
                                        <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-md overflow-x-auto font-mono text-sm border border-gray-200 dark:border-gray-700">
                                {example.output}
                            </pre>
                                    </div>
                                </div>
                                {example.explanation && (
                                    <div className="mt-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation:</div>
                                        <div className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-3 rounded-md text-sm">
                                            {example.explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}