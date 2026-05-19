import { useStaffTheme } from "./StaffThemeProvider";

export default function StaffThemeSelector() {
  const { color, setColor, colors } = useStaffTheme();
  return (
    <div className="flex gap-2 justify-center my-2">
      {Object.entries(colors).map(([key, val]) => (
        <button
          key={key}
          aria-label={val.name}
          className={`w-7 h-7 rounded-full border-2 ${color === key ? "border-white scale-110" : "border-white/30"} transition-transform duration-200 shadow-lg focus:outline-none`}
          style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
          onClick={() => setColor(key)}
        >
          <span className={`block w-full h-full rounded-full bg-gradient-to-br ${val.button}`}></span>
        </button>
      ))}
    </div>
  );
}
