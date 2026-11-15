"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { apiFetch } from "@/lib/api";

function getRegisterErrors(message: unknown): string[] {
	const value =
		typeof message === "object" && message !== null && "message" in message
			? message.message
			: message;

	const messages = (Array.isArray(value) ? value : [value]).filter(
		(item): item is string => typeof item === "string" && item.trim() !== "",
	);

	return messages.length > 0 ? messages : ["Błąd rejestracji"];
}

export default function RegisterPage() {
	const [form, setForm] = useState({ login: "", email: "", password: "" });
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (loading) return;

		if (form.password !== confirmPassword) {
			setErrors(["Wpisane hasła muszą być identyczne."]);
			return;
		}

		setErrors([]);
		setLoading(true);

		try {
			const res = await apiFetch("/auth/register", {
				method: "POST",
				body: JSON.stringify(form),
			});
			const json: unknown = await res.json();

			if (
				res.ok &&
				typeof json === "object" &&
				json !== null &&
				"success" in json &&
				json.success === true
			) {
				router.push("/login?registered=true");
				return;
			}

			const message =
				typeof json === "object" && json !== null && "message" in json
					? json.message
					: undefined;

			setErrors(getRegisterErrors(message));
		} catch {
			setErrors(["Błąd połączenia"]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-surface text-fg p-6">
			<div className="w-full max-w-md bg-surface-2 border border-line p-8 rounded-3xl shadow-2xl">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-black italic tracking-tighter">
						DOŁĄCZ DO <span className="text-primary">SMART</span>
					</h1>
					<p className="text-muted text-sm mt-2">
						Rywalizuj i poprawiaj swoje wyniki
					</p>
				</div>

				{errors.length > 0 && (
					<div
						role="alert"
						className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-xl mb-6 text-xs"
					>
						<ul className="list-disc list-inside">
							{errors.map((error, index) => (
								<li key={index}>{error}</li>
							))}
						</ul>
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="space-y-4"
				>
					<FormField
						label="Login"
						name="login"
						autoComplete="username"
						value={form.login}
						onChange={e => setForm({ ...form, login: e.target.value })}
						required
					/>

					<FormField
						label="E-mail"
						name="email"
						type="email"
						autoComplete="email"
						value={form.email}
						onChange={e => setForm({ ...form, email: e.target.value })}
						required
					/>

					<FormField
						label="Hasło"
						name="password"
						type="password"
						autoComplete="new-password"
						value={form.password}
						onChange={e =>
							setForm({ ...form, password: e.target.value })
						}
						required
					/>

					<FormField
						label="Powtórz hasło"
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						required
					/>

					<Button
						text={loading ? "Tworzenie konta..." : "Zarejestruj się"}
						type="primary"
						htmlType="submit"
					/>
				</form>

				<p className="text-center mt-8 text-sm text-muted">
					Masz już konto?{" "}
					<Link
						href="/login"
						className="text-primary font-bold hover:opacity-80 transition"
					>
						Zaloguj się
					</Link>
				</p>
			</div>
		</div>
	);
}
