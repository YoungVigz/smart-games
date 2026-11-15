"use client";

import { useId, useState, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";

type FormFieldProps = ComponentPropsWithoutRef<"input"> & {
	label: string;
};

export function FormField({
	label,
	id,
	type = "text",
	className = "",
	disabled,
	...props
}: FormFieldProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const [visible, setVisible] = useState(false);
	const isPassword = type === "password";

	return (
		<div className="space-y-1">
			<label
				htmlFor={inputId}
				className="ml-1 text-xs font-bold uppercase text-muted"
			>
				{label}
			</label>

			<div className="relative">
				<input
					{...props}
					id={inputId}
					type={isPassword && visible ? "text" : type}
					disabled={disabled}
					className={`w-full rounded-2xl border border-line bg-surface-3 p-4 outline-none transition-all focus:border-primary ${isPassword ? "pr-14" : ""
						} ${className}`}
				/>

				{isPassword && (
					<button
						type="button"
						disabled={disabled}
						onClick={() => setVisible(current => !current)}
						aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
						className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
					>
						{visible ? (
							<EyeOff size={20} aria-hidden="true" />
						) : (
							<Eye size={20} aria-hidden="true" />
						)}
					</button>
				)}
			</div>
		</div>
	);
}
