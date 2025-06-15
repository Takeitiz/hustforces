import { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import 'react-calendar-heatmap/dist/styles.css';
import { subYears, format, eachDayOfInterval } from 'date-fns';
import { Tooltip } from 'react-tooltip';

interface SubmissionHeatmapProps {
    calendarData: Record<string, number>;
}

interface HeatmapValue {
    date: string;
    count: number;
}

export function SubmissionHeatmap({ calendarData }: SubmissionHeatmapProps) {
    const [values, setValues] = useState<HeatmapValue[]>([]);

    useEffect(() => {
        // Prepare data for the heatmap
        const endDate = new Date();
        const startDate = subYears(endDate, 1);

        // Create an array of all dates in the range
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        // Map each date to its submission count
        const heatmapValues = dateRange.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                date: dateStr,
                count: calendarData[dateStr] || 0
            };
        });

        setValues(heatmapValues);
    }, [calendarData]);

    // Find the maximum count for color scaling
    const maxCount = Math.max(...Object.values(calendarData), 1);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Submission Activity</h2>

                <div className="mt-4 submission-heatmap-container">
                    <CalendarHeatmap
                        startDate={subYears(new Date(), 1)}
                        endDate={new Date()}
                        values={values}
                        showMonthLabels={true}
                        classForValue={(value) => {
                            if (!value || value.count === 0) {
                                return 'color-empty';
                            }
                            // Calculate color intensity based on count
                            const intensity = Math.min(Math.ceil((value.count / maxCount) * 4), 4);
                            return `color-scale-${intensity}`;
                        }}
                        // Add custom title attribute for each day
                        titleForValue={(value) => {
                            return value ? `${value.date}: ${value.count} submission${value.count !== 1 ? 's' : ''}` : 'No data';
                        }}
                        // Add onClick handler to show more details if needed
                        onClick={(value) => {
                            if (value) {
                                console.log(`Clicked on ${value.date}: ${value.count} submissions`);
                            }
                        }}
                    />

                    {/* Tooltip component for the heatmap */}
                    <Tooltip
                        anchorSelect=".react-calendar-heatmap rect"
                        place="top"
                        className="heatmap-tooltip"
                    />

                    <style>{`
                        .submission-heatmap-container .react-calendar-heatmap .color-empty {
                            fill: #ebedf0;
                        }
                        .dark .submission-heatmap-container .react-calendar-heatmap .color-empty {
                            fill: #2d3748;
                        }
                        .submission-heatmap-container .react-calendar-heatmap .color-scale-1 {
                            fill: #c6e48b;
                        }
                        .submission-heatmap-container .react-calendar-heatmap .color-scale-2 {
                            fill: #7bc96f;
                        }
                        .submission-heatmap-container .react-calendar-heatmap .color-scale-3 {
                            fill: #239a3b;
                        }
                        .submission-heatmap-container .react-calendar-heatmap .color-scale-4 {
                            fill: #196127;
                        }
                        
                        /* Custom tooltip styling */
                        .heatmap-tooltip {
                            background-color: rgba(0, 0, 0, 0.9) !important;
                            color: white !important;
                            padding: 4px 8px !important;
                            font-size: 12px !important;
                            border-radius: 4px !important;
                        }
                        
                        /* Ensure rect elements show pointer cursor */
                        .submission-heatmap-container .react-calendar-heatmap rect {
                            cursor: pointer;
                        }
                    `}</style>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#ebedf0] dark:bg-[#2d3748]"></div>
                        <span>No submissions</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#c6e48b]"></div>
                        <span>1-2 submissions</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#7bc96f]"></div>
                        <span>3-4 submissions</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#239a3b]"></div>
                        <span>5+ submissions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}