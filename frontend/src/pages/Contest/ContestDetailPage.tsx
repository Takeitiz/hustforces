import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format, intervalToDuration, formatDuration } from "date-fns";
import { toast } from "react-toastify";
import { CalendarClock, Trophy, Clock, ListOrdered, ArrowRight, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import contestService from "../../service/contestService";
import { ContestDetailDto } from "../../types/contest";
import { useAuth } from "../../contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

export function ContestDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [contest, setContest] = useState<ContestDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchContest();
        }
    }, [id]);

    // Timer effect for countdown
    useEffect(() => {
        if (!contest) return;

        // Only set up countdown for upcoming or active contests
        if (contest.status === 'ENDED') {
            setTimeLeft(null);
            return;
        }

        const targetTime = new Date(
            contest.status === 'UPCOMING' ? contest.startTime : contest.endTime
        );

        const updateCountdown = () => {
            const now = new Date();
            if (now >= targetTime) {
                setTimeLeft(null);
                fetchContest(); // Refresh to update contest status
                return;
            }

            const duration = intervalToDuration({ start: now, end: targetTime });
            const formatted = formatDuration(duration, {
                format: ['days', 'hours', 'minutes', 'seconds'],
                delimiter: ', '
            });
            setTimeLeft(formatted);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [contest]);

    const fetchContest = async () => {
        setLoading(true);
        try {
            if (!id) throw new Error("Contest ID is missing");
            const data = await contestService.getContest(id);
            setContest(data);

            // Check registration status if user is logged in
            if (isLoggedIn) {
                try {
                    const registrationStatus = await contestService.checkRegistrationStatus(id);
                    setIsRegistered(registrationStatus.registered);
                } catch (error) {
                    // If the API returns 404 or error, assume not registered
                    setIsRegistered(false);
                }
            }
        } catch (error) {
            console.error("Error fetching contest:", error);
            toast.error("Failed to load contest");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterClick = () => {
        if (!isLoggedIn) {
            toast.info("Please log in to register for the contest");
            navigate("/login");
            return;
        }

        // Show confirmation modal
        setShowRegistrationModal(true);
    };

    const handleConfirmRegistration = async () => {
        if (!id) return;

        setRegistering(true);
        setShowRegistrationModal(false);

        try {
            await contestService.registerForContest(id);
            toast.success("Successfully registered for the contest");
            setIsRegistered(true);
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.info("You are already registered for this contest");
                setIsRegistered(true);
            } else {
                console.error("Error registering for contest:", error);
                toast.error("Failed to register for the contest");
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleEnterContest = async () => {
        if (!isLoggedIn) {
            toast.info("Please log in to enter the contest");
            navigate("/login");
            return;
        }

        if (!id || !contest) return;

        // Check if the user is registered
        if (!isRegistered) {
            toast.error("You must register for the contest first");
            return;
        }

        // Check if the contest is active
        if (contest.status !== 'ACTIVE') {
            toast.error("This contest is not currently active");
            return;
        }

        // Navigate to the first problem of the contest
        if (contest.problems.length > 0) {
            navigate(`/contests/${id}/problem/0`);
        } else {
            toast.error("This contest has no problems");
        }
    };

    const getContestStatusClass = (status: string) => {
        switch (status) {
            case 'UPCOMING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'ENDED':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Contest not found</p>
                    <Link to="/contests" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Return to contests
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    to="/contests"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    <ArrowRight className="h-4 w-4 transform rotate-180" />
                    Back to Contests
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h1 className="text-3xl font-bold">{contest.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContestStatusClass(contest.status)}`}>
                                    {contest.status}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-6 mb-6 text-sm">
                                <div className="flex items-center">
                                    <CalendarClock className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <div className="text-gray-700 dark:text-gray-300">
                                            {format(new Date(contest.startTime), "PPP")}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {format(new Date(contest.startTime), "p")} - {format(new Date(contest.endTime), "p")}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <div className="text-gray-700 dark:text-gray-300">
                                            Duration
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {formatDuration(
                                                intervalToDuration({
                                                    start: new Date(contest.startTime),
                                                    end: new Date(contest.endTime)
                                                }),
                                                { format: ['hours', 'minutes'] }
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <ListOrdered className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <div className="text-gray-700 dark:text-gray-300">
                                            Problems
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {contest.problems.length} problems
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {timeLeft && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {contest.status === 'UPCOMING' ? 'Starts in:' : 'Ends in:'}
                                    </div>
                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {timeLeft}
                                    </div>
                                </div>
                            )}

                            {contest.status === 'UPCOMING' && !isRegistered && (
                                <Button
                                    className="px-6 flex items-center gap-2"
                                    onClick={handleRegisterClick}
                                    disabled={registering}
                                >
                                    {registering ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="h-4 w-4" />
                                            Register for Contest
                                        </>
                                    )}
                                </Button>
                            )}

                            {contest.status === 'UPCOMING' && isRegistered && (
                                <div className="flex items-center gap-2 px-6 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
                                    <Trophy className="h-4 w-4" />
                                    <span className="font-medium">Registered</span>
                                </div>
                            )}

                            {contest.status === 'ACTIVE' && (
                                <Button
                                    className="px-6 flex items-center gap-2"
                                    onClick={handleEnterContest}
                                    disabled={!isRegistered}
                                >
                                    <Trophy className="h-4 w-4" />
                                    {isRegistered ? 'Enter Contest' : 'Register First'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="problems">Problems</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Contest Description</h2>
                        <div className="prose prose-blue dark:prose-invert max-w-none">
                            <p>{contest.description}</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="problems">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Index</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="text-right">Solved</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contest.problems.map((problem) => (
                                    <TableRow key={problem.id}>
                                        <TableCell className="font-medium">{String.fromCharCode(65 + problem.index)}</TableCell>
                                        <TableCell>{problem.title}</TableCell>
                                        <TableCell className="text-right">{problem.solved}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="leaderboard">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Contest Leaderboard</h2>
                            <Link
                                to={`/contests/${contest.id}/leaderboard`}
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                Full Leaderboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {contest.leaderboard.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">Rank</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contest.leaderboard.slice(0, 10).map((entry) => (
                                            <TableRow key={entry.userId}>
                                                <TableCell className="font-medium">{entry.rank}</TableCell>
                                                <TableCell>
                                                    <Link
                                                        to={`/profile/${entry.username}`}
                                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        {entry.username}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right">{entry.totalPoints}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No leaderboard data available yet
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Registration Confirmation Modal */}
            <Modal
                isOpen={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
                title="Confirm Contest Registration"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Important Notice
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Once you register for this contest, <strong>you cannot undo this action</strong>.
                                Make sure you are ready to participate before proceeding.
                            </p>
                            <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <p>• You will be able to view all problems when the contest starts</p>
                                <p>• Your submissions will be counted towards the leaderboard</p>
                                <p>• You cannot unregister from the contest</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowRegistrationModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRegistration}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Confirm Registration
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}