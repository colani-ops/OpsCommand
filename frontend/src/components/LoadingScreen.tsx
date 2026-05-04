type LoadingScreenProps = {
  label?: string;
  fullscreen?: boolean;
};

export default function LoadingScreen({
  label = "Loading...",
  fullscreen = false,
}: LoadingScreenProps) {
  return (
    <div
      style={{
        minHeight: fullscreen ? "100vh" : 220,
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 14,
        }}
      >
        <img
          src="/icons/loading.png"
          alt="Loading"
          style={{
            width: 82,
            height: 82,
            objectFit: "contain",
            animation: "opscommand-spin 1.8s linear infinite",
            filter: "drop-shadow(0 0 10px rgba(201,165,106,0.18))",
          }}
        />

        <div
          style={{
            color: "#f3efe6",
            fontFamily: "monospace",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "rgba(215,177,118,0.88)",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          Synchronizing command data...
        </div>
      </div>

      <style>
        {`
          @keyframes opscommand-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}