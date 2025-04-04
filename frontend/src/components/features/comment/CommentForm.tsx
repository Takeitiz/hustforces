import { useState } from "react";
import { Button } from "../../ui/Button";
import { useAuth } from "../../../contexts/AuthContext";

interface CommentFormProps {
    onSubmit: (content: string) => void;
    initialValue?: string;
}

export function CommentForm({ onSubmit, initialValue = "" }: CommentFormProps) {
    const [content, setContent] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isLoggedIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800 min-h-[100px]"
                placeholder={isLoggedIn ? "Write your comment..." : "Please log in to comment"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isLoggedIn || isSubmitting}
            />

            <div className="flex justify-end mt-3">
                <Button
                    type="submit"
                    disabled={!isLoggedIn || !content.trim() || isSubmitting}
                    className="flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Posting...
                        </>
                    ) : "Post Comment"}
                </Button>
            </div>
        </form>
    );
}