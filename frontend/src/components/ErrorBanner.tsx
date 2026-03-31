type ErrorBannerProps = {
  error: string | null;
};

export default function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      style={{
        background: "#2a0000",
        color: "#ff6b6b",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        border: "1px solid #ff6b6b",
      }}
    >
      ⚠ {error}
    </div>
  );
}