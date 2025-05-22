import { apiClient } from "../api/client"

// User management
export interface AdminUserDto {
    id: string
    username: string
    email: string
    role: "USER" | "ADMIN"
    profilePicture?: string
    createdAt: string
    lastLogin?: string
    status: "ACTIVE" | "SUSPENDED" | "BANNED"
}

export interface UserUpdateDto {
    role?: "USER" | "ADMIN"
    status?: "ACTIVE" | "SUSPENDED" | "BANNED"
}

// Problem management
export interface AdminProblemDto {
    id: string
    title: string
    slug: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    hidden: boolean
    hasDescription: boolean
    hasStructure: boolean
    testCaseCount: number
    boilerplateGenerated: boolean
    createdAt: string
    updatedAt: string
}

export interface ProblemCreateDto {
    title: string
    slug: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    hidden: boolean
}

export interface TestCase {
    id: string
    input: string
    output: string
    explanation?: string
}

export interface ProblemDetailDto {
    id: string
    title: string
    description: string
    structure: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    timeLimit: number
    memoryLimit: number
    tags: string[]
    testcases: TestCase[]
    createdAt: string
    updatedAt: string
    slug: string
    submissionCount: number
    acceptedCount?: number
    hidden?: boolean
}

// Contest management
export interface AdminContestDto {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    hidden: boolean
    leaderboard: boolean
    problems: { id: string; title: string; index: number }[]
    status: "UPCOMING" | "ACTIVE" | "ENDED"
    createdAt: string
    updatedAt: string
}

export interface ContestCreateDto {
    title: string
    description: string
    startTime: string
    endTime: string
    isHidden: boolean
    leaderboard: boolean
    problems: { problemId: string; index: number }[]
}

// Pagination response
export interface PageResponse<T> {
    content: T[]
    totalPages: number
    totalElements: number
    size: number
    number: number
}

// Test case pagination response
export interface TestCasesPageResponse {
    testcases: TestCase[]
    totalPages: number
    totalElements: number
    page: number
    size: number
}

/**
 * Admin service for handling admin-related API calls
 */
const adminService = {
    // User management
    getUsers: async (page = 0, size = 10, sort = "username,asc", search = ""): Promise<PageResponse<AdminUserDto>> => {
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort,
                ...(search ? { search } : {}),
            }).toString()

            const response = await apiClient.get<PageResponse<AdminUserDto>>(`/admin/users?${query}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch users:", error)
            throw error
        }
    },

    updateUserRole: async (userId: string, role: "USER" | "ADMIN"): Promise<AdminUserDto> => {
        try {
            const response = await apiClient.put<AdminUserDto>(`/admin/users/${userId}/role?role=${role}`)
            return response.data
        } catch (error) {
            console.error("Failed to update user role:", error)
            throw error
        }
    },

    updateUserStatus: async (userId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED"): Promise<AdminUserDto> => {
        try {
            const response = await apiClient.put<AdminUserDto>(`/admin/users/${userId}/status?status=${status}`)
            return response.data
        } catch (error) {
            console.error("Failed to update user status:", error)
            throw error
        }
    },

    // Problem management
    getProblems: async (
        page = 0,
        size = 10,
        sort = "createdAt,desc",
        search = "",
    ): Promise<PageResponse<AdminProblemDto>> => {
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort,
                ...(search ? { search } : {}),
            }).toString()

            const response = await apiClient.get<PageResponse<AdminProblemDto>>(`/admin/problems?${query}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch problems:", error)
            throw error
        }
    },

    getProblem: async (slug: string): Promise<ProblemDetailDto> => {
        try {
            const response = await apiClient.get<ProblemDetailDto>(`/admin/problems/${slug}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch problem:", error)
            throw error
        }
    },

    // New method to fetch paginated test cases for a problem
    getProblemTestCases: async (slug: string, page = 0, size = 10): Promise<TestCasesPageResponse> => {
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
            }).toString()

            const response = await apiClient.get<TestCasesPageResponse>(`/admin/problems/${slug}/testcases?${query}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch problem test cases:", error)
            throw error
        }
    },

    createProblem: async (problem: ProblemCreateDto): Promise<AdminProblemDto> => {
        try {
            const response = await apiClient.post<AdminProblemDto>("/admin/problems", problem)
            return response.data
        } catch (error) {
            console.error("Failed to create problem:", error)
            throw error
        }
    },

    updateProblemVisibility: async (slug: string, hidden: boolean): Promise<AdminProblemDto> => {
        try {
            const response = await apiClient.put<AdminProblemDto>(`/admin/problems/${slug}/visibility?hidden=${hidden}`)
            return response.data
        } catch (error) {
            console.error("Failed to update problem visibility:", error)
            throw error
        }
    },

    deleteProblem: async (slug: string): Promise<void> => {
        try {
            await apiClient.delete(`/admin/problems/${slug}`)
        } catch (error) {
            console.error("Failed to delete problem:", error)
            throw error
        }
    },

    // Contest management
    getContests: async (
        page = 0,
        size = 10,
        sort = "startTime,desc",
        search = "",
    ): Promise<PageResponse<AdminContestDto>> => {
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort,
                ...(search ? { search } : {}),
            }).toString()

            const response = await apiClient.get<PageResponse<AdminContestDto>>(`/admin/contests?${query}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch contests:", error)
            throw error
        }
    },

    getContest: async (id: string): Promise<AdminContestDto> => {
        try {
            const response = await apiClient.get<AdminContestDto>(`/admin/contests/${id}`)
            return response.data
        } catch (error) {
            console.error("Failed to fetch contest:", error)
            throw error
        }
    },

    createContest: async (contest: ContestCreateDto): Promise<AdminContestDto> => {
        try {
            const response = await apiClient.post<AdminContestDto>("/admin/contests", contest)
            return response.data
        } catch (error) {
            console.error("Failed to create contest:", error)
            throw error
        }
    },

    updateContestVisibility: async (id: string, hidden: boolean): Promise<AdminContestDto> => {
        try {
            const response = await apiClient.put<AdminContestDto>(`/admin/contests/${id}`, {
                isHidden: hidden,
            })
            return response.data
        } catch (error) {
            console.error("Failed to update contest visibility:", error)
            throw error
        }
    },

    deleteContest: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/admin/contests/${id}`)
        } catch (error) {
            console.error("Failed to delete contest:", error)
            throw error
        }
    },

    updateLeaderboard: async (id: string): Promise<void> => {
        try {
            await apiClient.post(`/admin/contests/${id}/updateLeaderboard`)
        } catch (error) {
            console.error("Failed to update leaderboard:", error)
            throw error
        }
    },

    // Import functionality
    importProblem: async (slug: string): Promise<string> => {
        try {
            const response = await apiClient.get<string>(`/import/${slug}`)
            return response.data
        } catch (error) {
            console.error("Failed to import problem:", error)
            throw error
        }
    },

    importAllProblems: async (): Promise<string> => {
        try {
            const response = await apiClient.get<string>("/import")
            return response.data
        } catch (error) {
            console.error("Failed to import all problems:", error)
            throw error
        }
    },

    seedLanguages: async (): Promise<string> => {
        try {
            const response = await apiClient.get<string>("/import/languages")
            return response.data
        } catch (error) {
            console.error("Failed to seed languages:", error)
            throw error
        }
    },


    generateBoilerplate: async (slug: string): Promise<string> => {
        try {
            const response = await apiClient.post<string>(`/admin/problems/${slug}/generate-boilerplate`)
            return response.data
        } catch (error) {
            console.error("Failed to generate boilerplate:", error)
            throw error
        }
    },

    // Dashboard statistics
    getDashboardStats: async (): Promise<{
        userCount: number
        problemCount: number
        contestCount: number
        solutionCount: number
        recentUsers: AdminUserDto[]
        recentProblems: AdminProblemDto[]
    }> => {
        try {
            const response = await apiClient.get("/admin/dashboard/stats")
            return response.data
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error)
            throw error
        }
    },
}

export default adminService
