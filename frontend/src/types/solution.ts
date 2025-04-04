import { UserSummaryDto, CommentDto } from "./discussion";

export interface SolutionDto {
    id: string;
    description: string;
    user: UserSummaryDto;
    problemId: string;
    problemTitle: string;
    languageId: string;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    upvotes: number;
    downvotes: number;
}

export interface SolutionDetailDto {
    id: string;
    code: string;
    description: string;
    user: UserSummaryDto;
    problemId: string;
    problemTitle: string;
    languageId: string;
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    comments: CommentDto[];
}