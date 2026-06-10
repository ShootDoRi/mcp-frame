export interface JsonPreviewProps {
  value: unknown;
}

export function JsonPreview({ value }: JsonPreviewProps) {
  return (
    <pre
      style={{
        overflow: "auto",
        border: "1px solid #d8dee4",
        borderRadius: 8,
        padding: 12,
        fontSize: 13
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
