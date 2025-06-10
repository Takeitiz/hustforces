import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Globe, Lock, Clock, ArrowRight, Plus, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinRoomModal } from './JoinRoomModal';
import codeRoomService from '../../service/codeRoomService';
import { CodeRoomDto } from '../../types/codeRoom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

export function RoomBrowser() {
    const navigate = useNavigate();

    // Use local state for modals instead of store state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const [rooms, setRooms] = useState<CodeRoomDto[]>([]);
    const [myRooms, setMyRooms] = useState<CodeRoomDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'my-rooms'>('public');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Load rooms
    useEffect(() => {
        loadRooms();
    }, [activeTab, page]);

    const loadRooms = async () => {
        setLoading(true);
        try {
            if (activeTab === 'public') {
                const response = await codeRoomService.getPublicRooms(page);
                if (page === 0) {
                    setRooms(response.content);
                } else {
                    setRooms(prev => [...prev, ...response.content]);
                }
                setHasMore(page < response.totalPages - 1);
            } else {
                const myRoomsData = await codeRoomService.getMyRooms();
                setMyRooms(myRoomsData);
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (roomCode: string) => {
        navigate(`/code-room/${roomCode}`);
    };

    const filteredRooms = (activeTab === 'public' ? rooms : myRooms).filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.problemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'LOCKED':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'COMPLETED':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'ABANDONED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getLanguageIcon = (languageId: string) => {
        switch (languageId) {
            case 'cpp':
                return '🔷';
            case 'java':
                return '☕';
            case 'js':
                return '🟨';
            case 'rs':
                return '🦀';
            default:
                return '📝';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Code Rooms</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Join a collaborative coding session or create your own room
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                    onClick={() => {
                        console.log('Create button clicked'); // Debug log
                        setShowCreateModal(true);
                    }}
                    className="flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Create New Room
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        console.log('Join button clicked'); // Debug log
                        setShowJoinModal(true);
                    }}
                    className="flex items-center justify-center gap-2"
                >
                    <Hash size={18} />
                    Join with Code
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'public'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('public');
                        setPage(0);
                    }}
                >
                    Public Rooms
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'my-rooms'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('my-rooms');
                        setPage(0);
                    }}
                >
                    My Rooms
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                />
            </div>

            {/* Room List */}
            {loading && page === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mb-4 text-6xl">🚪</div>
                    <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm
                            ? 'Try adjusting your search terms'
                            : activeTab === 'public'
                                ? 'Be the first to create a public room!'
                                : 'You haven\'t joined any rooms yet'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{room.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Hash size={14} />
                                            {room.roomCode}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                                </div>

                                {room.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                        {room.description}
                                    </p>
                                )}

                                {room.problemTitle && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        <span className="font-medium">Problem:</span> {room.problemTitle}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Users size={16} />
                                        <span>{room.currentParticipants}/{room.maxParticipants}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {room.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                                        <span>{room.isPublic ? 'Public' : 'Private'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>{getLanguageIcon(room.languageId)}</span>
                                        <span>{room.languageId.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <Clock size={12} className="inline mr-1" />
                                        {formatDistanceToNow(new Date(room.lastActivityAt), { addSuffix: true })}
                                    </div>
                                    <div className="flex gap-2">
                                        {room.allowVoiceChat && <span title="Voice Chat">🎤</span>}
                                        {room.allowVideoChat && <span title="Video Chat">📹</span>}
                                        {room.allowScreenShare && <span title="Screen Share">🖥️</span>}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Host: <span className="font-medium">{room.hostUsername}</span>
                    </span>
                                        {room.status === 'ACTIVE' && room.currentParticipants < room.maxParticipants ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleJoinRoom(room.roomCode)}
                                                className="flex items-center gap-1"
                                            >
                                                Join
                                                <ArrowRight size={14} />
                                            </Button>
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                        {room.currentParticipants >= room.maxParticipants ? 'Full' : 'Unavailable'}
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More */}
            {activeTab === 'public' && hasMore && !loading && (
                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={loading}
                    >
                        Load More Rooms
                    </Button>
                </div>
            )}

            {/* Modals - Using local state */}
            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => {
                    console.log('Closing create modal'); // Debug log
                    setShowCreateModal(false);
                }}
            />
            <JoinRoomModal
                isOpen={showJoinModal}
                onClose={() => {
                    console.log('Closing join modal'); // Debug log
                    setShowJoinModal(false);
                }}
            />
        </div>
    );
}