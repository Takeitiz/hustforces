import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/Table";
import { ContestLeaderboardEntryDto, ProblemSubmissionStatusDto, ContestProblemInfoDto } from "../../../types/contest";
import { useAuth } from "../../../contexts/AuthContext";

interface LeaderboardProps {
    leaderboard: ContestLeaderboardEntryDto[];
    problems: ContestProblemInfoDto[];
    highlightCurrentUser?: boolean;
}

export function Leaderboard({ leaderboard, problems, highlightCurrentUser = true }: LeaderboardProps) {
    const { user } = useAuth();
    const [sortedLeaderboard, setSortedLeaderboard] = useState<ContestLeaderboardEntryDto[]>([]);

    useEffect(() => {
        // Ensure the leaderboard is sorted by rank
        const sorted = [...leaderboard].sort((a, b) => a.rank - b.rank);
        setSortedLeaderboard(sorted);
    }, [leaderboard]);

    // Generate column letters (A, B, C, ...) based on problem indices
    const getProblemLetter = (index: number) => String.fromCharCode(65 + index);

    // Render the status of a problem submission
    const renderProblemStatus = (problem: ProblemSubmissionStatusDto) => {
        if (!problem) {
            return null;
        }

        if (problem.solved) {
            return (
                <div className="flex flex-col items-center">
                    <Check className="h-5 w-5 text-green-500" />
                    <div className="text-xs mt-1">{problem.points}</div>
                    <div className="text-xs text-gray-500">
                        {problem.attempts > 1 ? `${problem.attempts} tries` : "1 try"}
                    </div>
                </div>
            );
        } else if (problem.attempts > 0) {
            return (
                <div className="flex flex-col items-center">
                    <X className="h-5 w-5 text-red-500" />
                    <div className="text-xs text-gray-500 mt-1">
                        {problem.attempts} {problem.attempts === 1 ? "try" : "tries"}
                    </div>
                </div>
            );
        }

        return null;
    };

    if (sortedLeaderboard.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No leaderboard data available yet
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        {problems.map((problem) => (
                            <TableHead key={problem.id} className="text-center">
                                <Link
                                    to={`/problem/${problem.problemId}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {getProblemLetter(problem.index)}
                                </Link>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedLeaderboard.map((entry) => {
                        const isCurrentUser = highlightCurrentUser && user && user.id === entry.userId;
                        return (
                            <TableRow
                                key={entry.userId}
                                className={isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                            >
                                <TableCell className="font-medium">{entry.rank}</TableCell>
                                <TableCell>
                                    <Link
                                        to={`/profile/${entry.username}`}
                                        className={`hover:underline ${isCurrentUser ? "font-bold text-blue-600 dark:text-blue-400" : ""}`}
                                    >
                                        {entry.username}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                    {entry.totalPoints}
                                </TableCell>
                                {problems.map((problem) => {
                                    const status = entry.problemStatuses.find(
                                        (s) => s.problemId === problem.problemId
                                    );
                                    return (
                                        <TableCell key={problem.id} className="text-center">
                                            {renderProblemStatus(status as ProblemSubmissionStatusDto)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}