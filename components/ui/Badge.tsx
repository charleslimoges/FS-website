interface BadgeProps {
  label: string;
  variant?: "default" | "blue" | "green" | "amber" | "red" | "purple";
  size?: "sm" | "md";
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
};

export default function Badge({ label, variant = "default", size = "md" }: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg ${variantClasses[variant]} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
