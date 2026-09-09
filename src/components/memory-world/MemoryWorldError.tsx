export function MemoryWorldError({ message }: { message?: string }) {
  return (
    <div className="mw-error">
      <p>3D Memory World is not available on this device.</p>
      {message ? <p className="mw-error-detail">{message}</p> : null}
    </div>
  );
}
