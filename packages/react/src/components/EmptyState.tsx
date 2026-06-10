import type { ReactNode } from "react";

export interface EmptyStateProps {
  title?: string;
  children?: ReactNode;
}

export function EmptyState({
  title = "No frame data yet",
  children
}: EmptyStateProps) {
  return (
    <div
      style={{
        border: "1px solid #d8dee4",
        borderRadius: 8,
        padding: 16,
        color: "#57606a"
      }}
    >
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
    </div>
  );
}
