export const SubmitStatus = {
    SUBMIT: "SUBMIT",
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    FAILED: "FAILED"
} as const;

export type SubmitStatusType = typeof SubmitStatus[keyof typeof SubmitStatus];