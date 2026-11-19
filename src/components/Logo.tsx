export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="50 30 160 160"
      role="img"
      aria-label="Selah"
    >
      <rect x="50" y="30" width="160" height="160" rx="36" fill="#F2B544" />
      <g fill="none" stroke="#1F3A5F" strokeLinecap="round">
        <path
          strokeWidth="14"
          transform="translate(-10 0)"
          d="M152 88A22 22 0 1 0 130 110A22 22 0 1 1 108 132"
        />
        <path
          strokeWidth="5"
          d="M154.7 75.3A18 18 0 0 1 154.7 100.7M161.8 68.2A28 28 0 0 1 161.8 107.8"
        />
      </g>
    </svg>
  );
}