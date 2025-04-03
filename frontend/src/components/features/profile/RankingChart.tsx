import { RankingHistory } from "../../../types/profile.ts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { parseISO, format } from 'date-fns';

interface RankingChartProps {
    rankingHistory: RankingHistory[];
}

export function RankingChart({ rankingHistory }: RankingChartProps) {
    // Sort the ranking history by date
    const sortedHistory = [...rankingHistory].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Format the data for the chart
    const data = sortedHistory.map(item => ({
        date: item.date,
        rating: item.rating,
        formattedDate: format(parseISO(item.date), 'MMM d, yyyy'),
        contestName: item.contestName
    }));

    if (rankingHistory.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Rating History</h2>
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No rating history available
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Rating History</h2>

                <div className="mt-4" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="formattedDate"
                                angle={-45}
                                textAnchor="end"
                                tick={{ fontSize: 12 }}
                                height={60}
                            />
                            <YAxis
                                domain={['dataMin - 100', 'dataMax + 100']}
                                label={{ value: 'Rating', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                content={({ active, payload}) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-md border border-gray-200 dark:border-gray-600">
                                                <p className="text-sm font-medium">{data.contestName}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{data.formattedDate}</p>
                                                <p className="text-sm font-semibold mt-1">
                                                    Rating: {data.rating}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rating"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={<Dot r={4} fill="#3b82f6" />}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}