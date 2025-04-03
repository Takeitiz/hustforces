import { Difficulty } from "../../../types/problem.ts";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProblemsSolvedChartProps {
    problemsByDifficulty: Record<Difficulty, number>;
}

export function ProblemsSolvedChart({ problemsByDifficulty }: ProblemsSolvedChartProps) {
    // Format data for pie chart
    const data = Object.entries(problemsByDifficulty)
        .filter(([_, count]) => count > 0) // Only include non-zero counts
        .map(([difficulty, count]) => ({
            name: difficulty,
            value: count
        }));

    // Define colors for each difficulty
    const COLORS = {
        'EASY': '#10b981', // green
        'MEDIUM': '#f59e0b', // amber
        'HARD': '#ef4444' // red
    };

    // Calculate total solved problems
    const totalSolved = Object.values(problemsByDifficulty).reduce((sum, count) => sum + count, 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Problems Solved</h2>

                <div className="text-center mb-4">
                    <span className="text-3xl font-bold">{totalSolved}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">total</span>
                </div>

                {totalSolved > 0 ? (
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[entry.name as keyof typeof COLORS]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value} problems`, 'Solved']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No problems solved yet
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    {Object.entries(problemsByDifficulty).map(([difficulty, count]) => {
                        // Choose color based on difficulty
                        let bgColor = "bg-green-100 dark:bg-green-900/30";
                        let textColor = "text-green-600 dark:text-green-300";

                        if (difficulty === "MEDIUM") {
                            bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
                            textColor = "text-yellow-600 dark:text-yellow-300";
                        } else if (difficulty === "HARD") {
                            bgColor = "bg-red-100 dark:bg-red-900/30";
                            textColor = "text-red-600 dark:text-red-300";
                        }

                        const percentage = totalSolved > 0 ? (count / totalSolved) * 100 : 0;

                        return (
                            <div key={difficulty} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-medium ${textColor}`}>{difficulty}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {count} ({percentage.toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${bgColor} rounded-full`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}