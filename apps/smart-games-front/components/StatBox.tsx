import { ReactNode } from "react";

interface StatBoxProps {
	label: string;
	value: number | string;
	icon: ReactNode;
}

export const StatBox = ({ label, value, icon }: StatBoxProps) => {
	return (
		<div className="bg-surface-2 border-2 border-line px-6 py-4 rounded-xl hover:border-muted transition-all">
			<div className="flex justify-between items-center mb-4">
				<span className="text-sm font-black text-muted uppercase tracking-widest">
					{label}
				</span>
				<div className={`text-accent`}>{icon}</div>
			</div>
			<p className="text-3xl font-black text-fg tracking-tighter">
				{value}
			</p>
		</div>
	);
}
