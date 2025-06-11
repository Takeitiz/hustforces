"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Code, Globe, Lock, Video, Mic, Monitor } from "lucide-react"
import { Modal } from "../ui/Modal"
import { Button } from "../ui/Button"
import { Label } from "../ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select"
import { useNavigate } from "react-router-dom"
import useCodeRoomStore from "../../contexts/CodeRoomContext"
import { type CreateCodeRoomRequest, LanguageId } from "../../types/codeRoom"
import type { ProblemDto } from "../../types/problem"
import type { ContestDto } from "../../types/contest"
import problemService from "../../service/problemService"
import contestService from "../../service/contestService"
import codeRoomService from "../../service/codeRoomService"
import { toast } from "react-toastify"

interface CreateRoomModalProps {
    isOpen: boolean
    onClose: () => void
    problemId?: string
    contestId?: string
    initialCode?: string
}

export function CreateRoomModal({
                                    isOpen,
                                    onClose,
                                    problemId: defaultProblemId,
                                    contestId: defaultContestId,
                                    initialCode,
                                }: CreateRoomModalProps) {
    const navigate = useNavigate()
    const { setRoom, setShowCreateRoomModal, setCreatingRoom, isCreatingRoom } = useCodeRoomStore()

    const [formData, setFormData] = useState<CreateCodeRoomRequest>({
        name: "",
        description: "",
        problemId: defaultProblemId,
        contestId: defaultContestId,
        languageId: LanguageId.cpp,
        maxParticipants: 2,
        isPublic: true,
        allowVoiceChat: true,
        allowVideoChat: true,
        allowScreenShare: true,
        initialCode: initialCode || "",
    })

    const [problems, setProblems] = useState<ProblemDto[]>([])
    const [contests, setContests] = useState<ContestDto[]>([])
    const [loadingProblems, setLoadingProblems] = useState(false)
    const [loadingContests, setLoadingContests] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load problems
    useEffect(() => {
        const loadProblems = async () => {
            if (defaultProblemId) return // Skip if we have a default problem

            setLoadingProblems(true)
            setError(null)
            try {
                const response = await problemService.getProblems(0, 100)
                setProblems(response.content || [])
            } catch (error) {
                console.error("Failed to load problems:", error)
                setError("Failed to load problems")
            } finally {
                setLoadingProblems(false)
            }
        }

        if (isOpen) {
            loadProblems()
        }
    }, [isOpen, defaultProblemId])

    // Load contests
    useEffect(() => {
        const loadContests = async () => {
            if (defaultContestId) return // Skip if we have a default contest

            setLoadingContests(true)
            setError(null)
            try {
                const activeContests = await contestService.getActiveContests()
                setContests(activeContests)
            } catch (error) {
                console.error("Failed to load contests:", error)
                setError("Failed to load contests")
            } finally {
                setLoadingContests(false)
            }
        }

        if (isOpen) {
            loadContests()
        }
    }, [isOpen, defaultContestId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error("Room name is required")
            return
        }

        try {
            setCreatingRoom(true)
            setError(null)

            const newRoom = await codeRoomService.createRoom(formData)

            setRoom(newRoom)
            toast.success("Room created successfully!")

            // Close modal and navigate
            onClose()
            setShowCreateRoomModal(false)

            // Navigate to the new room
            navigate(`/code-room/${newRoom.roomCode}`)
        } catch (error: any) {
            console.error("Failed to create room:", error)
            const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to create room"
            toast.error(errorMessage)
            setError(errorMessage)
        } finally {
            setCreatingRoom(false)
        }
    }

    const handleInputChange = (field: keyof CreateCodeRoomRequest, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleToggle = (field: keyof CreateCodeRoomRequest) => {
        setFormData((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setError(null)
        }
    }, [isOpen])

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Code Room">
            <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Room Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Room Name *
                        </Label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter room name"
                            required
                            disabled={isCreatingRoom}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                        </Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Describe your coding session"
                            rows={3}
                            disabled={isCreatingRoom}
                        />
                    </div>

                    {/* Problem Selection */}
                    {!defaultProblemId && (
                        <div className="space-y-2">
                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem (Optional)</Label>
                            <Select
                                value={formData.problemId || "none"}
                                onValueChange={(value) => handleInputChange("problemId", value === "none" ? undefined : value)}
                                disabled={isCreatingRoom}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a problem" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    <SelectItem value="none">No problem</SelectItem>
                                    {loadingProblems ? (
                                        <SelectItem value="loading" disabled>
                                            Loading problems...
                                        </SelectItem>
                                    ) : problems.length > 0 ? (
                                        problems.map((problem) => (
                                            <SelectItem key={problem.id} value={problem.id}>
                                                {problem.title}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-problems" disabled>
                                            No problems available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Contest Selection */}
                    {!defaultContestId && (
                        <div className="space-y-2">
                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contest (Optional)</Label>
                            <Select
                                value={formData.contestId || "none"}
                                onValueChange={(value) => handleInputChange("contestId", value === "none" ? undefined : value)}
                                disabled={isCreatingRoom}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a contest" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    <SelectItem value="none">No contest</SelectItem>
                                    {loadingContests ? (
                                        <SelectItem value="loading" disabled>
                                            Loading contests...
                                        </SelectItem>
                                    ) : contests.length > 0 ? (
                                        contests.map((contest) => (
                                            <SelectItem key={contest.id} value={contest.id}>
                                                {contest.title}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-contests" disabled>
                                            No contests available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Language Selection */}
                    <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programming Language *</Label>
                        <Select
                            value={formData.languageId}
                            onValueChange={(value) => handleInputChange("languageId", value as LanguageId)}
                            disabled={isCreatingRoom}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={LanguageId.cpp}>C++</SelectItem>
                                <SelectItem value={LanguageId.java}>Java</SelectItem>
                                <SelectItem value={LanguageId.js}>JavaScript</SelectItem>
                                <SelectItem value={LanguageId.rs}>Rust</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Max Participants */}
                    <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Participants *</Label>
                        <Select
                            value={formData.maxParticipants.toString()}
                            onValueChange={(value) => handleInputChange("maxParticipants", Number.parseInt(value))}
                            disabled={isCreatingRoom}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num} participants
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            {formData.isPublic ? (
                                <Globe size={20} className="text-blue-600" />
                            ) : (
                                <Lock size={20} className="text-gray-600" />
                            )}
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.isPublic ? "Public Room" : "Private Room"}
                            </Label>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle("isPublic")}
                            disabled={isCreatingRoom}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                formData.isPublic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                            } ${isCreatingRoom ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
              <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
              />
                        </button>
                    </div>

                    {/* Communication Options */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication Options</h3>

                        <div className="space-y-3">
                            {/* Voice Chat */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mic size={20} className={formData.allowVoiceChat ? "text-blue-600" : "text-gray-400"} />
                                    <Label className="text-sm text-gray-700 dark:text-gray-300">Allow Voice Chat</Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle("allowVoiceChat")}
                                    disabled={isCreatingRoom}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        formData.allowVoiceChat ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                                    } ${isCreatingRoom ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowVoiceChat ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                                </button>
                            </div>

                            {/* Video Chat */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Video size={20} className={formData.allowVideoChat ? "text-blue-600" : "text-gray-400"} />
                                    <Label className="text-sm text-gray-700 dark:text-gray-300">Allow Video Chat</Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle("allowVideoChat")}
                                    disabled={isCreatingRoom}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        formData.allowVideoChat ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                                    } ${isCreatingRoom ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowVideoChat ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                                </button>
                            </div>

                            {/* Screen Share */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Monitor size={20} className={formData.allowScreenShare ? "text-blue-600" : "text-gray-400"} />
                                    <Label className="text-sm text-gray-700 dark:text-gray-300">Allow Screen Share</Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle("allowScreenShare")}
                                    disabled={isCreatingRoom}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        formData.allowScreenShare ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                                    } ${isCreatingRoom ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowScreenShare ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isCreatingRoom}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!formData.name.trim() || isCreatingRoom}
                            className="flex items-center gap-2"
                        >
                            {isCreatingRoom ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Code size={18} />
                                    Create Room
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    )
}
