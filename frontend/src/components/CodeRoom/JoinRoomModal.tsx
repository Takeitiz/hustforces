import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, ArrowRight, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import useCodeRoomStore from '../../store/useCodeRoomStore';
import { useCodeRoom } from '../../hooks/useCodeRoom';
import codeRoomService from '../../service/codeRoomService';
import { toast } from 'react-toastify';

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomCode?: string;
}

export function JoinRoomModal({ isOpen, onClose, roomCode: defaultRoomCode }: JoinRoomModalProps) {
    const navigate = useNavigate();
    const { joinRoom, isJoiningRoom } = useCodeRoom();
    const { setShowJoinRoomModal } = useCodeRoomStore();

    const [roomCode, setRoomCode] = useState(defaultRoomCode || '');
    const [roomPreview, setRoomPreview] = useState<any>(null);
    const [isCheckingRoom, setIsCheckingRoom] = useState(false);

    const handleRoomCodeChange = async (code: string) => {
        setRoomCode(code.toUpperCase());

        // Check room details when code is complete (assuming 6 characters)
        if (code.length === 6) {
            setIsCheckingRoom(true);
            try {
                const roomDetails = await codeRoomService.getRoomByCode(code.toUpperCase());
                setRoomPreview(roomDetails.room);
            } catch (error) {
                setRoomPreview(null);
            } finally {
                setIsCheckingRoom(false);
            }
        } else {
            setRoomPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode) {
            toast.error('Please enter a room code');
            return;
        }

        try {
            await joinRoom(roomCode);
            onClose();
            setShowJoinRoomModal(false);
            navigate(`/code-room/${roomCode}`);
        } catch (error) {
            // Error is handled in the hook
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'text-green-600 dark:text-green-400';
            case 'LOCKED':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'COMPLETED':
            case 'ABANDONED':
                return 'text-gray-600 dark:text-gray-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return '🟢';
            case 'LOCKED':
                return '🔒';
            case 'COMPLETED':
                return '✅';
            case 'ABANDONED':
                return '🚫';
            default:
                return '⚪';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Join Code Room">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Room Code Input */}
                <div>
                    <Label htmlFor="roomCode" className="block text-sm font-medium mb-2">
                        Room Code
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="roomCode"
                            value={roomCode}
                            onChange={(e) => handleRoomCodeChange(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 text-lg font-mono uppercase border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 tracking-wider"
                            placeholder="ENTER CODE"
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Enter the 6-character room code shared by the host
                    </p>
                </div>

                {/* Room Preview */}
                {isCheckingRoom && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Checking room...
              </span>
                        </div>
                    </div>
                )}

                {roomPreview && !isCheckingRoom && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {roomPreview.name}
                                </h3>
                                {roomPreview.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {roomPreview.description}
                                    </p>
                                )}
                            </div>
                            <span className={`text-sm font-medium ${getStatusColor(roomPreview.status)}`}>
                {getStatusIcon(roomPreview.status)} {roomPreview.status}
              </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <Users size={16} className="text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                  {roomPreview.currentParticipants}/{roomPreview.maxParticipants}
                </span>
                            </div>

                            {roomPreview.problemTitle && (
                                <div className="text-gray-600 dark:text-gray-400">
                                    Problem: <span className="font-medium">{roomPreview.problemTitle}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 text-xs">
                            {roomPreview.allowVoiceChat && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  🎤 Voice
                </span>
                            )}
                            {roomPreview.allowVideoChat && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  📹 Video
                </span>
                            )}
                            {roomPreview.allowScreenShare && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  🖥️ Screen Share
                </span>
                            )}
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                {roomPreview.languageId.toUpperCase()}
              </span>
                        </div>

                        {roomPreview.status !== 'ACTIVE' && (
                            <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
                                ⚠️ This room is {roomPreview.status.toLowerCase()}. You may not be able to join.
                            </div>
                        )}

                        {roomPreview.currentParticipants >= roomPreview.maxParticipants && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                                ⚠️ This room is full ({roomPreview.currentParticipants}/{roomPreview.maxParticipants} participants)
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Access */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Or browse public rooms:
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onClose();
                            navigate('/code-rooms');
                        }}
                        className="w-full"
                    >
                        Browse Public Rooms
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isJoiningRoom}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!roomCode || roomCode.length !== 6 || isJoiningRoom || (roomPreview && roomPreview.status !== 'ACTIVE')}
                        className="flex items-center gap-2"
                    >
                        {isJoiningRoom ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Joining...
                            </>
                        ) : (
                            <>
                                Join Room
                                <ArrowRight size={18} />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}