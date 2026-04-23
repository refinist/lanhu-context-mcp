export function formatStopError(
  error: unknown,
  stopInstruction: string
): string {
  return (
    (error instanceof Error ? error.message : String(error)) + stopInstruction
  );
}
