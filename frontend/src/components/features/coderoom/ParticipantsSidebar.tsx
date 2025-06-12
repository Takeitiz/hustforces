import React from 'react';
import { Crown, UserCheck, Eye, MoreVertical, Mic, MicOff, Video, VideoOff, Monitor, WifiOff, UserX } from 'lucide-react';
import useCodeRoomStore from '../../../contexts/CodeRoomContext';
import { useCodeRoom } from '../../../hooks/useCodeRoom';
import {ParticipantRole, ParticipantStatus} from '../../../types/codeRoom';

export function ParticipantsSidebar() {
    const {
        participants,
        currentUser,
        typingUsers,
        remoteMediaStates,
        showParticipants,
        setShowParticipants
    } = useCodeRoomStore();

    const { kickParticipant, updateParticipantRole, isHost } = useCodeRoom();

    const [showDropdown, setShowDropdown] = React.useState<string | null>(null);

    const getRoleIcon = (role: ParticipantRole) => {
        switch (role) {
            case ParticipantRole.HOST:
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case ParticipantRole.COLLABORATOR:
                return <UserCheck className="w-4 h-4 text-blue-500" />;
            case ParticipantRole.VIEWER:
                return <Eye className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: ParticipantStatus) => {
        switch (status) {
            case ParticipantStatus.ACTIVE:
                return 'bg-green-500';
            case ParticipantStatus.IDLE:
                return 'bg-yellow-500';
            case ParticipantStatus.DISCONNECTED:
                return 'bg-red-500';
            case ParticipantStatus.LEFT:
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusTooltip = (status: ParticipantStatus) => {
        switch (status) {
            case ParticipantStatus.ACTIVE:
                return 'Active';
            case ParticipantStatus.IDLE:
                return 'Idle';
            case ParticipantStatus.DISCONNECTED:
                return 'Disconnected';
            case ParticipantStatus.LEFT:
                return 'Left the room';
            default:
                return status;
        }
    };

    const getParticipantsList = () => {
        const participantArray = Array.from(participants.values());

        // Sort: Host first, then by role, then by status (active first), then by name
        return participantArray.sort((a, b) => {
            // Host always first
            if (a.role === ParticipantRole.HOST) return -1;
            if (b.role === ParticipantRole.HOST) return 1;

            // Then by role
            if (a.role === ParticipantRole.COLLABORATOR && b.role === ParticipantRole.VIEWER) return -1;
            if (b.role === ParticipantRole.COLLABORATOR && a.role === ParticipantRole.VIEWER) return 1;

            // Then by status (active participants before disconnected)
            if (a.status === ParticipantStatus.ACTIVE && b.status !== ParticipantStatus.ACTIVE) return -1;
            if (b.status === ParticipantStatus.ACTIVE && a.status !== ParticipantStatus.ACTIVE) return 1;

            // Finally by name
            return a.username.localeCompare(b.username);
        });
    };

    if (!showParticipants) {
        return (
            <button
                onClick={() => setShowParticipants(true)}
                className="fixed right-4 top-24 bg-white dark:bg-gray-800 rounded-l-lg shadow-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Show participants"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{participants.size}</span>
                    <UserCheck size={20} />
                </div>
            </button>
        );
    }

    const activeParticipants = Array.from(participants.values()).filter(
        p => p.status === ParticipantStatus.ACTIVE
    ).length;

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Participants ({participants.size})</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activeParticipants} active
                        </p>
                    </div>
                    <button
                        onClick={() => setShowParticipants(false)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Hide participants"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
                {getParticipantsList().map((participant) => {
                    const isCurrentUser = participant.userId === currentUser?.userId;
                    const isTyping = typingUsers.has(participant.userId);
                    const mediaState = remoteMediaStates.get(participant.userId);
                    const isOffline = participant.status === ParticipantStatus.DISCONNECTED ||
                        participant.status === ParticipantStatus.LEFT;

                    return (
                        <div
                            key={participant.userId}
                            className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${
                                isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            } ${isOffline ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    {/* Avatar */}
                                    <div className="relative">
                                        {participant.profilePicture ? (
                                            <img
                                                src={participant.profilePicture}
                                                alt={participant.username}
                                                className={`w-10 h-10 rounded-full ${isOffline ? 'grayscale' : ''}`}
                                            />
                                        ) : (
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                                                    isOffline ? 'opacity-50' : ''
                                                }`}
                                                style={{ backgroundColor: participant.colorHex }}
                                            >
                                                {participant.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div
                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(
                                                participant.status
                                            )}`}
                                            title={getStatusTooltip(participant.status)}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${isOffline ? 'text-gray-500' : ''}`}>
                                                {participant.username}
                                                {isCurrentUser && ' (You)'}
                                            </span>
                                            {getRoleIcon(participant.role)}
                                            {participant.status === ParticipantStatus.LEFT && (
                                                <span title="Left the room">
                                                    <UserX className="w-3 h-3 text-gray-400" />
                                                </span>
                                            )}
                                        </div>

                                        {/* Status indicators */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Media indicators - only show for active participants */}
                                            {!isOffline && (mediaState || participant) && (
                                                <div className="flex items-center gap-1">
                                                    {participant.isMuted ? (
                                                        <MicOff className="w-3 h-3 text-gray-400" />
                                                    ) : (
                                                        <Mic className="w-3 h-3 text-green-500" />
                                                    )}
                                                    {participant.isVideoOn ? (
                                                        <Video className="w-3 h-3 text-green-500" />
                                                    ) : (
                                                        <VideoOff className="w-3 h-3 text-gray-400" />
                                                    )}
                                                    {participant.isScreenSharing && (
                                                        <Monitor className="w-3 h-3 text-blue-500" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Typing indicator */}
                                            {!isOffline && isTyping && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 italic animate-pulse">
                                                    typing...
                                                </span>
                                            )}

                                            {/* Connection status */}
                                            {participant.status === ParticipantStatus.DISCONNECTED && (
                                                <span title="Connection lost">
                                                    <WifiOff className="w-3 h-3 text-red-500" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - only for active participants */}
                                {isHost() && !isCurrentUser && !isOffline && participant.role !== ParticipantRole.HOST && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDropdown(showDropdown === participant.userId ? null : participant.userId)}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {showDropdown === participant.userId && (
                                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                                                {participant.role === ParticipantRole.VIEWER ? (
                                                    <button
                                                        onClick={() => {
                                                            updateParticipantRole(participant.userId, ParticipantRole.COLLABORATOR);
                                                            setShowDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                                    >
                                                        Make Collaborator
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            updateParticipantRole(participant.userId, ParticipantRole.VIEWER);
                                                            setShowDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                                    >
                                                        Make Viewer
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to kick ${participant.username} from the room?`)) {
                                                            kickParticipant(participant.userId);
                                                            setShowDropdown(null);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    Kick from Room
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span>Host</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-blue-500" />
                        <span>Collaborator</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gray-500" />
                        <span>Viewer</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}