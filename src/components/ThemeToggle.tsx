// src/components/ThemeToggle.tsx
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { value: "dark" | "light" | "system"; icon: string; label: string }[] = [
    { value: "dark", icon: "🌙", label: "Dark" },
    { value: "light", icon: "☀️", label: "Light" },
    { value: "system", icon: "💻", label: "System" },
  ];

  return (
    <div className="theme-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`theme-toggle-btn ${theme === opt.value ? "active" : ""}`}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}