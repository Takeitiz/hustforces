import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { Search, Trophy } from "lucide-react";
import contestService from "../../service/contestService";
import { ContestDto } from "../../types/contest";
import { ContestList } from "../../components/features/contest/ContestList";
import { Button } from "../../components/ui/Button";

export function ContestsPage() {
    const [activeTab, setActiveTab] = useState("active");
    const [activeContests, setActiveContests] = useState<ContestDto[]>([]);
    const [upcomingContests, setUpcomingContests] = useState<ContestDto[]>([]);
    const [pastContests, setPastContests] = useState<ContestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ContestDto[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        setLoading(true);
        try {
            const [active, upcoming, pastResponse] = await Promise.all([
                contestService.getActiveContests(),
                contestService.getUpcomingContests(),
                contestService.getPastContests()
            ]);

            setActiveContests(active);
            setUpcomingContests(upcoming);
            setPastContests(pastResponse.content);
        } catch (error) {
            console.error("Error fetching contests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            const response = await contestService.searchContests(searchQuery);
            setSearchResults(response.content);
        } catch (error) {
            console.error("Error searching contests:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <Trophy className="mr-2" size={24} />
                        Coding Contests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Participate in coding competitions and climb the leaderboards
                    </p>
                </div>

                <div className="w-full md:w-auto flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                            placeholder="Search contests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            </div>

            {searching ? (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Search Results</h2>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearching(false);
                                setSearchQuery("");
                            }}
                        >
                            Clear Search
                        </Button>
                    </div>
                    <ContestList
                        contests={searchResults}
                        emptyMessage="No contests match your search"
                    />
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="active">Active Contests</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming Contests</TabsTrigger>
                        <TabsTrigger value="past">Past Contests</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <ContestList
                                contests={activeContests}
                                emptyMessage="No active contests at the moment. Check back later or view upcoming contests."
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="upcoming">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <ContestList
                                contests={upcomingContests}
                                emptyMessage="No upcoming contests scheduled. Check back later."
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="past">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <ContestList
                                contests={pastContests}
                                emptyMessage="No past contests found."
                            />
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}