"use client";

import { useConsoleStore } from "@/stores/useConsoleStore";
import type { ConsoleView } from "@/stores/useConsoleStore";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ThemeSwitcher } from "../ThemeSwitcher";

const views: Record<ConsoleView, ReactNode> = {
  commands: null,
  themes: <ThemeSwitcher />,
  search: null,
};

const titles: Record<ConsoleView, string> = {
  commands: "Komendy",
  themes: "Wybierz motyw",
  search: "Wyszukaj",
};

export const ConsolePanel = () => {
  const view = useConsoleStore((state) => state.view);
  const toggle = useConsoleStore((state) => state.toggle);
  const close = useConsoleStore((state) => state.close);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "p";

      if (!isShortcut) return;

      event.preventDefault();

      if (!event.repeat) {
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggle]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (view === null) {
      if (dialog.open) {
        dialog.close();
      }

      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    // Focus na wskazany element widoku lub samą zawartość panelu.
    const focusTarget =
      dialog.querySelector<HTMLElement>("[data-console-autofocus]") ??
      contentRef.current;

    focusTarget?.focus({ preventScroll: true });
  }, [view]);


    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
            event.preventDefault();
            close();
            }}
            onClose={() => {
            if (!dialogRef.current?.open) {
                close();
            }
            }}
            onClick={(event) => {
            if (event.target === event.currentTarget) {
                close();
            }
            }}
            className="
            fixed inset-0 m-auto
            w-[calc(100%_-_2rem)] max-w-xl max-h-[85dvh]
            overflow-y-auto rounded-[32px] sm:rounded-[40px]
            border border-line bg-surface-2
            p-0 text-fg shadow-2xl
            backdrop:backdrop-blur-xs
            "
        >
            <div
            ref={contentRef}
            tabIndex={-1}
            className="outline-none"
            >
            <header className="flex items-center justify-between gap-4 border-b border-line p-6 sm:px-8">
                <h2
                id={titleId}
                className="text-2xl font-black italic uppercase tracking-tighter sm:text-3xl"
                >
                {view !== null ? titles[view] : "Panel"}
                </h2>

                <button
                type="button"
                onClick={close}
                aria-label="Zamknij panel"
                className="
                    flex h-11 w-11 shrink-0 cursor-pointer
                    items-center justify-center
                    rounded-2xl border border-line
                    bg-surface-3 text-muted
                    transition-colors
                    hover:border-primary/50 hover:bg-primary/10 hover:text-primary
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-primary
                "
                >
                <X size={18} />
                </button>
            </header>

            <div className="min-h-32 p-6 sm:p-8">
                {view !== null ? views[view] : null}
            </div>
            </div>
        </dialog>
    );
};