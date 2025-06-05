import { useState } from 'react';
import { Users, Plus, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinRoomModal } from './JoinRoomModal';

interface CodeRoomEntryButtonProps {
    problemId?: string;
    problemTitle?: string;
    contestId?: string;
    contestTitle?: string;
    initialCode?: string;
    variant?: 'default' | 'compact';
}

export function CodeRoomEntryButton({
                                        problemId,
                                        problemTitle,
                                        contestId,
                                        contestTitle,
                                        initialCode,
                                        variant = 'default'
                                    }: CodeRoomEntryButtonProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    if (variant === 'compact') {
        return (
            <>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCreateModal(true)}
                        title="Start collaborative session"
                    >
                        <Users size={16} className="mr-1" />
                        Collaborate
                    </Button>
                </div>

                <CreateRoomModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    problemId={problemId}
                    contestId={contestId}
                    initialCode={initialCode}
                />
                <JoinRoomModal
                    isOpen={showJoinModal}
                    onClose={() => setShowJoinModal(false)}
                />
            </>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Collaborative Coding</h3>
                    <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Work together in real-time with voice, video, and shared coding.
                </p>

                {problemTitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Problem: <span className="font-medium">{problemTitle}</span>
                    </p>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Create Room
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowJoinModal(true)}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        <Hash size={18} />
                        Join Room
                    </Button>
                </div>
            </div>

            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                problemId={problemId}
                contestId={contestId}
                initialCode={initialCode}
            />
            <JoinRoomModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
            />
        </>
    );
}