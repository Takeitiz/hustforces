import { CommentDto } from "../../../types/discussion";
import { CommentItem } from "./CommentItem";

interface CommentListProps {
    comments: CommentDto[];
    onCommentUpdate?: (commentId: string, updatedComment: Partial<CommentDto>) => void;
    onCommentDelete?: (commentId: string) => void;
}

export function CommentList({ comments, onCommentUpdate, onCommentDelete }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    onUpdate={onCommentUpdate}
                    onDelete={onCommentDelete}
                />
            ))}
        </div>
    );
}