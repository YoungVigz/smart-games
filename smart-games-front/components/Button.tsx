import { ReactNode } from "react";

interface ButtonProps {
    text: string;
    type: "primary" | "secondary";
    onClick: () => void;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
}

export const Button = ({ text, type, onClick, icon, iconPosition = "left" }: ButtonProps) => {
    const styles = {
        primary: "bg-secondary hover:bg-primary shadow-lg shadow-secondary/20",
        secondary: "bg-surface-3 hover:bg-line",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full ${styles[type]} text-fg py-4 px-8 rounded-2xl font-bold transition cursor-pointer flex items-center justify-center gap-3`}
        >
            {icon && iconPosition === "left" && icon}
            <span>{text}</span>
            {icon && iconPosition === "right" && icon}
        </button>
    );
};