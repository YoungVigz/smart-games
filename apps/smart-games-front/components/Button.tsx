import { ReactNode } from "react";

interface ButtonProps {
	text: string;
	type: "primary" | "secondary" | "squash";
	onClick?: () => void;
	htmlType?: "button" | "submit" | "reset"
	icon?: ReactNode;
	iconPosition?: "left" | "right";
}

export const Button = ({
	text,
	type,
	onClick,
	htmlType = "button",
	icon,
	iconPosition = "left",
}: ButtonProps) => {
	const styles = {
		primary: "py-4 font-bold bg-primary hover:bg-secondary shadow-lg shadow-primary/20",
		secondary: "py-4 font-bold border-2 border-line hover:border-primary/80",
		squash: "py-2 font-black border-2 border-line hover:border-primary/80 uppercase",
	};

	return (
		<button
			type={htmlType}
			onClick={onClick}
			className={`w-full text-fg px-8 rounded-xl ${styles[type]} transition cursor-pointer flex items-center justify-center gap-3`}
		>
			{icon && iconPosition === "left" && icon}
			<span>{text}</span>
			{icon && iconPosition === "right" && icon}
		</button>
	);
};
