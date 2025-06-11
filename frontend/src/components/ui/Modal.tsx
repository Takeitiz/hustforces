"use client"

import type React from "react"
import { useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = "" }) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    const handleClose = useCallback(() => {
        onClose()
    }, [onClose])

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            // Only close if clicking directly on the overlay, not on any child elements
            if (e.target === overlayRef.current) {
                handleClose()
            }
        },
        [handleClose],
    )

    const handleModalContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent any clicks inside the modal from bubbling to the overlay
        e.stopPropagation()
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose()
            }
        }

        // Add event listener
        document.addEventListener("keydown", handleEscape)

        // Prevent body scroll
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = originalOverflow
        }
    }, [isOpen, handleClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-2xl mx-4">
                <div
                    ref={modalRef}
                    className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-hidden ${className}`}
                    onClick={handleModalContentClick}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? "modal-title" : undefined}
                >
                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
                </div>
            </div>
        </div>
    )
}
