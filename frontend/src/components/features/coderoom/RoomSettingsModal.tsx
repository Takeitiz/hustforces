import React, { useState } from 'react';
import { Settings, Globe, Lock, Mic, Video, Monitor, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import useCodeRoomStore from '../../../contexts/CodeRoomContext';
import { useCodeRoom } from '../../../hooks/useCodeRoom';
import { UpdateCodeRoomRequest } from '../../../types/codeRoom';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../../ui/Select.tsx";

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RoomSettingsModal({ isOpen, onClose }: RoomSettingsModalProps) {
    const { room } = useCodeRoomStore();
    const { updateRoomSettings, deleteRoom, endSession, isHost } = useCodeRoom();

    const [formData, setFormData] = useState<UpdateCodeRoomRequest>({
        name: room?.name || '',
        description: room?.description || '',
        maxParticipants: room?.maxParticipants || 2,
        isPublic: room?.isPublic ?? true,
        allowVoiceChat: room?.allowVoiceChat ?? true,
        allowVideoChat: room?.allowVideoChat ?? true,
        allowScreenShare: room?.allowScreenShare ?? true
    });

    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!room) return null;

    const handleInputChange = (field: keyof UpdateCodeRoomRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isHost()) {
            toast.error('Only the host can update room settings');
            return;
        }

        setIsUpdating(true);
        try {
            await updateRoomSettings(formData);
            toast.success('Room settings updated');
            onClose();
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCopyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(room.roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Room code copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy room code');
        }
    };

    const handleCopyInviteLink = async () => {
        const inviteLink = `${window.location.origin}/code-room/join/${room.roomCode}`;
        try {
            await navigator.clipboard.writeText(inviteLink);
            toast.success('Invite link copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy invite link');
        }
    };

    const handleEndSession = async () => {
        if (confirm('Are you sure you want to end this session? This will save the session history.')) {
            try {
                await endSession();
                toast.success('Session ended');
                onClose();
            } catch (error) {
                toast.error('Failed to end session');
            }
        }
    };

    const handleDeleteRoom = async () => {
        if (showDeleteConfirm) {
            await deleteRoom();
            onClose();
        } else {
            setShowDeleteConfirm(true);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Room Settings">
            <div className="p-6">
                {/* Room Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-3">Room Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Room Code:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{room.roomCode}</span>
                                <button
                                    onClick={handleCopyRoomCode}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <span className="font-medium">{room.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Host:</span>
                            <span className="font-medium">{room.hostUsername}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                            <span className="font-medium">{room.currentParticipants}/{room.maxParticipants}</span>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyInviteLink}
                        className="mt-3 w-full"
                    >
                        Copy Invite Link
                    </Button>
                </div>

                {isHost() ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Room Name */}
                        <div>
                            <Label htmlFor="name" className="block text-sm font-medium mb-2">
                                Room Name
                            </Label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description" className="block text-sm font-medium mb-2">
                                Description
                            </Label>
                            <textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                                rows={3}
                            />
                        </div>

                        {/* Max Participants */}
                        <div>
                            <Label htmlFor="maxParticipants" className="block text-sm font-medium mb-2">
                                Max Participants
                            </Label>
                            <Select
                                value={formData.maxParticipants?.toString() || room.maxParticipants.toString()}
                                onValueChange={(value) => handleInputChange('maxParticipants', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <SelectItem
                                            key={num}
                                            value={num.toString()}
                                            disabled={num < room.currentParticipants}
                                        >
                                            {num} participants
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Privacy Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {formData.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                                <Label htmlFor="isPublic" className="text-sm font-medium">
                                    {formData.isPublic ? 'Public Room' : 'Private Room'}
                                </Label>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleInputChange('isPublic', !formData.isPublic)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.isPublic ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
                            </button>
                        </div>

                        {/* Media Options */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Communication Options</h3>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mic size={20} />
                                    <Label htmlFor="allowVoiceChat" className="text-sm">
                                        Allow Voice Chat
                                    </Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('allowVoiceChat', !formData.allowVoiceChat)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.allowVoiceChat ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowVoiceChat ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Video size={20} />
                                    <Label htmlFor="allowVideoChat" className="text-sm">
                                        Allow Video Chat
                                    </Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('allowVideoChat', !formData.allowVideoChat)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.allowVideoChat ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowVideoChat ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Monitor size={20} />
                                    <Label htmlFor="allowScreenShare" className="text-sm">
                                        Allow Screen Share
                                    </Label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('allowScreenShare', !formData.allowScreenShare)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.allowScreenShare ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allowScreenShare ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-4">
                            <div className="space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleEndSession}
                                >
                                    End Session
                                </Button>

                                {showDeleteConfirm ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDeleteRoom}
                                    >
                                        Confirm Delete
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDeleteRoom}
                                    >
                                        <Trash2 size={16} className="mr-1" />
                                        Delete Room
                                    </Button>
                                )}
                            </div>

                            <div className="space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex items-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Settings size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <Settings size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Only the room host can modify settings
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}