import { Link } from "react-router-dom"

interface LogoProps {
    size?: "small" | "medium" | "large"
    variant?: "default" | "footer"
    className?: string
}

export function Logo({ size = "medium", variant = "default", className = "" }: LogoProps) {
    // Size classes
    const sizeClasses = {
        small: "text-xl",
        medium: "text-2xl",
        large: "text-3xl md:text-4xl",
    }

    // Variant specific classes
    const variantClasses = {
        default: "flex items-center gap-2",
        footer: "flex items-center gap-2",
    }

    return (
        <Link to="/" className={`group font-bold ${variantClasses[variant]} ${className}`} aria-label="Hustforces - Home">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg p-2 transition-transform duration-300 group-hover:scale-110 shadow-md">
                <div className={`text-white ${size === "small" ? "text-sm" : "text-base"}`}>H</div>
            </div>
            <div className="flex items-center">
        <span
            className={`${sizeClasses[size]} bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-400`}
        >
          Hust
        </span>
                <span className={`${sizeClasses[size]} text-gray-800 dark:text-white`}>forces</span>
            </div>
        </Link>
    )
}

