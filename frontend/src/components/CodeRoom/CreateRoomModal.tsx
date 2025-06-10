import React, { useState, useEffect } from 'react';
import { Code, Globe, Lock, Video, Mic, Monitor } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useNavigate } from 'react-router-dom';
import useCodeRoomStore from '../../contexts/CodeRoomContext';
import { CreateCodeRoomRequest, LanguageId } from '../../types/codeRoom';
import { ProblemDto } from '../../types/problem';
import { ContestDto } from '../../types/contest';
import problemService from '../../service/problemService';
import contestService from '../../service/contestService';
import codeRoomService from '../../service/codeRoomService';
import { toast } from 'react-toastify';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemId?: string;
    contestId?: string;
    initialCode?: string;
}

export function CreateRoomModal({
                                    isOpen,
                                    onClose,
                                    problemId: defaultProblemId,
                                    contestId: defaultContestId,
                                    initialCode
                                }: CreateRoomModalProps) {
    const navigate = useNavigate();
    const { setRoom, setShowCreateRoomModal, setCreatingRoom, isCreatingRoom } = useCodeRoomStore();

    const [formData, setFormData] = useState<CreateCodeRoomRequest>({
        name: '',
        description: '',
        problemId: defaultProblemId,
        contestId: defaultContestId,
        languageId: LanguageId.cpp,
        maxParticipants: 2,
        isPublic: true,
        allowVoiceChat: true,
        allowVideoChat: true,
        allowScreenShare: true,
        initialCode: initialCode || ''
    });

    const [problems, setProblems] = useState<ProblemDto[]>([]);
    const [contests, setContests] = useState<ContestDto[]>([]);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const [loadingContests, setLoadingContests] = useState(false);

    // Load problems
    useEffect(() => {
        const loadProblems = async () => {
            setLoadingProblems(true);
            try {
                const response = await problemService.getProblems(0, 100); // Get first 100 problems
                setProblems(response.content || []);
            } catch (error) {
                console.error('Failed to load problems:', error);
            } finally {
                setLoadingProblems(false);
            }
        };

        if (!defaultProblemId) {
            loadProblems();
        }
    }, [defaultProblemId]);

    // Load contests
    useEffect(() => {
        const loadContests = async () => {
            setLoadingContests(true);
            try {
                // Use the actual contestService
                const activeContests = await contestService.getActiveContests();
                setContests(activeContests);
            } catch (error) {
                console.error('Failed to load contests:', error);
            } finally {
                setLoadingContests(false);
            }
        };

        if (!defaultContestId) {
            loadContests();
        }
    }, [defaultContestId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setCreatingRoom(true);

            // Create room directly here instead of using the hook
            const newRoom = await codeRoomService.createRoom(formData);
            console.log('Room created:', newRoom); // Debug log

            setRoom(newRoom);
            toast.success('Room created successfully!');

            // Close modal first
            onClose();
            setShowCreateRoomModal(false);

            // Then navigate after a small delay to ensure state updates
            setTimeout(() => {
                console.log('Navigating to:', `/code-room/${newRoom.roomCode}`); // Debug log
                navigate(`/code-room/${newRoom.roomCode}`);
            }, 100);

        } catch (error: any) {
            console.error('Failed to create room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to create room';
            toast.error(errorMessage);
        } finally {
            setCreatingRoom(false);
        }
    };

    const handleInputChange = (field: keyof CreateCodeRoomRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Code Room">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Room Name */}
                <div>
                    <Label htmlFor="name" className="block text-sm font-medium mb-2">
                        Room Name *
                    </Label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                        placeholder="Enter room name"
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
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                        placeholder="Describe your coding session"
                        rows={3}
                    />
                </div>

                {/* Problem Selection */}
                {!defaultProblemId && (
                    <div>
                        <Label htmlFor="problem" className="block text-sm font-medium mb-2">
                            Problem (Optional)
                        </Label>
                        <Select
                            value={formData.problemId || 'none'}
                            onValueChange={(value) => handleInputChange('problemId', value === 'none' ? undefined : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a problem" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No problem</SelectItem>
                                {loadingProblems ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    problems.map(problem => (
                                        <SelectItem key={problem.id} value={problem.id}>
                                            {problem.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Contest Selection */}
                {!defaultContestId && (
                    <div>
                        <Label htmlFor="contest" className="block text-sm font-medium mb-2">
                            Contest (Optional)
                        </Label>
                        <Select
                            value={formData.contestId || 'none'}
                            onValueChange={(value) => handleInputChange('contestId', value === 'none' ? undefined : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a contest" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No contest</SelectItem>
                                {loadingContests ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    contests.map(contest => (
                                        <SelectItem key={contest.id} value={contest.id}>
                                            {contest.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Language Selection */}
                <div>
                    <Label htmlFor="language" className="block text-sm font-medium mb-2">
                        Programming Language *
                    </Label>
                    <Select
                        value={formData.languageId}
                        onValueChange={(value) => handleInputChange('languageId', value as LanguageId)}
                    >
                        <SelectTrigger>
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
                <div>
                    <Label htmlFor="maxParticipants" className="block text-sm font-medium mb-2">
                        Max Participants *
                    </Label>
                    <Select
                        value={formData.maxParticipants.toString()}
                        onValueChange={(value) => handleInputChange('maxParticipants', parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <SelectItem key={num} value={num.toString()}>
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
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isCreatingRoom}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!formData.name || isCreatingRoom}
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
        </Modal>
    );
}