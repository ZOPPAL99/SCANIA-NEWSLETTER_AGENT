export type Severity = "error" | "warning";

export interface QAIssue {
  severity: Severity;
  code: string;
  message: string;
  location?: string;
}

export interface QAResult {
  ok: boolean;
  issues: QAIssue[];
}
