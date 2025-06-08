"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { User, ThumbsUp, ThumbsDown, MessageCircle, Edit, Trash } from "lucide-react"
import type { CommentDto } from "../../../types/discussion"
import { CommentForm } from "./CommentForm"
import { Button } from "../../ui/Button"
import { useAuth } from "../../../contexts/AuthContext"
import commentService from "../../../service/commentService"
import { toast } from "react-toastify"
import { Modal } from "../../ui/Modal"

interface CommentItemProps {
    comment: CommentDto
    onUpdate?: (commentId: string, updatedComment: Partial<CommentDto>) => void
    onDelete?: (commentId: string) => void
}

// Vote states: 1 = upvoted, -1 = downvoted, 0 = no vote
type VoteState = 1 | -1 | 0

export function CommentItem({ comment, onUpdate, onDelete }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [showReplies, setShowReplies] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [upvotes, setUpvotes] = useState(comment.upvotes)
    const [downvotes, setDownvotes] = useState(comment.downvotes)
    const [voteState, setVoteState] = useState<VoteState>(0)
    const [localContent, setLocalContent] = useState(comment.content)
    const [replies, setReplies] = useState(comment.replies || [])
    const { user, isLoggedIn } = useAuth()

    const canModify = isLoggedIn && user?.id === comment.user.id
    const hasReplies = replies && replies.length > 0

    // Check if user has already voted on this comment
    useEffect(() => {
        if (isLoggedIn && user?.id) {
            const checkUserVote = async () => {
                try {
                    const userVote = await commentService.getUserVote(comment.id)
                    if (userVote === "upvote") {
                        setVoteState(1)
                    } else if (userVote === "downvote") {
                        setVoteState(-1)
                    }
                } catch (error) {
                    console.error("Error fetching user vote:", error)
                }
            }

            checkUserVote()
        }
    }, [comment.id, isLoggedIn, user?.id])

    const handleVote = async (isUpvote: boolean) => {
        if (!isLoggedIn) {
            toast.info("Please log in to vote")
            return
        }

        try {
            // Determine the new vote state based on current state and vote action
            let newVoteState: VoteState = 0
            let upvoteDelta = 0
            let downvoteDelta = 0

            if (isUpvote) {
                // User clicked upvote
                if (voteState === 1) {
                    // Already upvoted, remove upvote
                    newVoteState = 0
                    upvoteDelta = -1
                } else if (voteState === -1) {
                    // Currently downvoted, switch to upvote
                    newVoteState = 1
                    upvoteDelta = 1
                    downvoteDelta = -1
                } else {
                    // No vote, add upvote
                    newVoteState = 1
                    upvoteDelta = 1
                }
            } else {
                // User clicked downvote
                if (voteState === -1) {
                    // Already downvoted, remove downvote
                    newVoteState = 0
                    downvoteDelta = -1
                } else if (voteState === 1) {
                    // Currently upvoted, switch to downvote
                    newVoteState = -1
                    upvoteDelta = -1
                    downvoteDelta = 1
                } else {
                    // No vote, add downvote
                    newVoteState = -1
                    downvoteDelta = 1
                }
            }

            // Optimistically update UI
            setVoteState(newVoteState)
            setUpvotes((prev) => prev + upvoteDelta)
            setDownvotes((prev) => prev + downvoteDelta)

            // Send request to server
            await commentService.voteComment(comment.id, isUpvote)

            // Show success message based on the action
            if (newVoteState === 0) {
                toast.success(isUpvote ? "Upvote removed" : "Downvote removed")
            } else {
                toast.success(isUpvote ? "Upvoted comment" : "Downvoted comment")
            }
        } catch (error) {
            // Revert optimistic update on error
            console.error("Error voting on comment:", error)
            toast.error("Failed to vote on comment")

            // Reset to previous state
            setVoteState(voteState)
            setUpvotes(comment.upvotes)
            setDownvotes(comment.downvotes)
        }
    }

    const handleReplySubmit = async (content: string) => {
        try {
            const newReply = await commentService.createComment(content, null, null, comment.id)
            toast.success("Reply posted successfully")
            setIsReplying(false)

            // Add the new reply to the local state
            setReplies([...replies, newReply])
            setShowReplies(true)
        } catch (error) {
            console.error("Error posting reply:", error)
            toast.error("Failed to post reply")
        }
    }

    const handleEditSubmit = async (content: string) => {
        try {
            await commentService.updateComment(comment.id, content)
            toast.success("Comment updated successfully")
            setIsEditing(false)

            // Update local content immediately
            setLocalContent(content)

            // Notify parent component if callback is provided
            if (onUpdate) {
                onUpdate(comment.id, { content })
            }
        } catch (error) {
            console.error("Error updating comment:", error)
            toast.error("Failed to update comment")
        }
    }

    const handleDelete = async () => {
        try {
            await commentService.deleteComment(comment.id)
            toast.success("Comment deleted successfully")
            setShowDeleteModal(false)

            // Notify parent component to remove this comment
            if (onDelete) {
                onDelete(comment.id)
            }
        } catch (error) {
            console.error("Error deleting comment:", error)
            toast.error("Failed to delete comment")
        }
    }

    const handleReplyUpdate = (replyId: string, updatedReply: Partial<CommentDto>) => {
        setReplies(replies.map(reply =>
            reply.id === replyId
                ? { ...reply, ...updatedReply }
                : reply
        ))
    }

    const handleReplyDelete = (replyId: string) => {
        setReplies(replies.filter(reply => reply.id !== replyId))
    }

    return (
        <>
            <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-center mb-3">
                        {comment.user.profilePicture ? (
                            <img
                                src={comment.user.profilePicture || "/placeholder.svg"}
                                alt={comment.user.username}
                                className="w-6 h-6 rounded-full mr-2"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-2">
                                <User size={14} />
                            </div>
                        )}
                        <span className="font-medium text-gray-700 dark:text-gray-300">{comment.user.username}</span>
                        <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    {isEditing ? (
                        <CommentForm onSubmit={handleEditSubmit} initialValue={localContent} />
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{localContent}</p>
                    )}

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <button
                            className={`flex items-center mr-4 ${
                                voteState === 1 ? "text-blue-600 dark:text-blue-400" : "hover:text-blue-600 dark:hover:text-blue-400"
                            }`}
                            onClick={() => handleVote(true)}
                        >
                            <ThumbsUp size={14} className="mr-1" />
                            <span>{upvotes}</span>
                        </button>

                        <button
                            className={`flex items-center mr-4 ${
                                voteState === -1 ? "text-red-600 dark:text-red-400" : "hover:text-red-600 dark:hover:text-red-400"
                            }`}
                            onClick={() => handleVote(false)}
                        >
                            <ThumbsDown size={14} className="mr-1" />
                            <span>{downvotes}</span>
                        </button>

                        <button
                            className="flex items-center mr-4 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            <MessageCircle size={14} className="mr-1" />
                            Reply
                        </button>

                        {canModify && (
                            <>
                                <button
                                    className="flex items-center mr-4 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    <Edit size={14} className="mr-1" />
                                    Edit
                                </button>

                                <button
                                    className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash size={14} className="mr-1" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isReplying && (
                    <div className="mt-3 ml-6">
                        <CommentForm onSubmit={handleReplySubmit} />
                    </div>
                )}

                {hasReplies && (
                    <div className="mt-3 ml-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 mb-3"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? `Hide ${replies.length} replies` : `Show ${replies.length} replies`}
                        </Button>

                        {showReplies && (
                            <div className="space-y-3">
                                {replies.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onUpdate={handleReplyUpdate}
                                        onDelete={handleReplyDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Comment"
            >
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        Are you sure you want to delete this comment? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Comment
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}