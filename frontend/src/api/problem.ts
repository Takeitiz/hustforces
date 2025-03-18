import {apiClient} from "./client.ts";
import {Problem} from "../types/problem.ts";
import axios from "axios";

export const getProblem = async (problemId: string, contestId?: string): Promise<Problem | null> => {
    try {
        let url = `/problems/${problemId}`;

        if (contestId) {
            url += `?contestId=${contestId}`;
        }

        const response = await apiClient.get<Problem>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        console.error('Error fetching problem:', error);
        throw error;
    }
};

export const getProblems = async (): Promise<Problem[]> => {
    try {
        const response = await apiClient.get<Problem[]>('/problems');
        return response.data;
    } catch (error) {
        console.error('Error fetching problems:', error);
        throw error;
    }
}

