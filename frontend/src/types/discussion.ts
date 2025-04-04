export interface UserSummaryDto {
    id: string;
    username: string;
    profilePicture?: string;
}

export interface CommentDto {
    id: string;
    content: string;
    user: UserSummaryDto;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    replies: CommentDto[];
}

export interface DiscussionDto {
    id: string;
    title: string;
    content: string;
    user: UserSummaryDto;
    problemId?: string;
    problemTitle?: string;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    viewCount: number;
    upvotes: number;
    downvotes: number;
}

export interface DiscussionDetailDto {
    id: string;
    title: string;
    content: string;
    user: UserSummaryDto;
    problemId?: string;
    problemTitle?: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    upvotes: number;
    downvotes: number;
    comments: CommentDto[];
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}