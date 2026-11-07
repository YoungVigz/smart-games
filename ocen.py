import os
import argparse

# Domyślna lista katalogów i plików do wykluczenia
DEFAULT_EXCLUSIONS = {
    '.git',
    '.next',
    'node_modules',
    '.next',
    '__pycache__',
    '.vscode',
    '.idea',
    '.env',
    '.expo',
    'venv',
    '.DS_Store',
    'package-lock.json',
    'next.config.ts',
    'eslint.config.mjs',
    'tsconfig.json',
    '.gitignore',
    'public',
    'yarn.lock'
}

# Mapowanie rozszerzeń plików na języki dla podświetlania składni w Markdown
EXTENSION_TO_LANG = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sh': 'shell',
    '.sql': 'sql',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.php': 'php',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.dockerfile': 'dockerfile',
    'Dockerfile': 'dockerfile'
}

def get_language_from_extension(filename):
    """Zwraca nazwę języka na podstawie rozszerzenia pliku."""
    # Sprawdź najpierw pełną nazwę pliku (np. dla Dockerfile)
    if filename in EXTENSION_TO_LANG:
        return EXTENSION_TO_LANG[filename]
    # Potem sprawdź rozszerzenie
    _, ext = os.path.splitext(filename)
    return EXTENSION_TO_LANG.get(ext.lower(), '') # Zwróć pusty string, jeśli nie znaleziono

def map_project_to_md(project_path, output_file, exclusions):
    """
    Mapuje strukturę projektu i zawartość plików do jednego pliku Markdown.

    :param project_path: Ścieżka do katalogu głównego projektu.
    :param output_file: Nazwa pliku wyjściowego .md.
    :param exclusions: Zbiór nazw katalogów i plików do wykluczenia.
    """
    # Upewnij się, że ścieżka projektu jest absolutna i znormalizowana
    project_path = os.path.abspath(project_path)
    
    if not os.path.isdir(project_path):
        print(f"Błąd: Podana ścieżka '{project_path}' nie jest prawidłowym katalogiem.")
        return

    try:
        with open(output_file, 'w', encoding='utf-8') as md_file:
            # Zapisz nagłówek z nazwą projektu
            project_name = os.path.basename(project_path)
            md_file.write(f"# Mapa Projektu: `{project_name}`\n\n")

            # Przechodzenie przez drzewo katalogów
            for root, dirs, files in os.walk(project_path, topdown=True):
                # Kluczowy mechanizm wykluczania: modyfikujemy listę `dirs` w miejscu,
                # aby `os.walk` nie wchodził do tych katalogów.
                dirs[:] = [d for d in dirs if d not in exclusions]

                # Wykluczanie plików
                files_to_process = [f for f in files if f not in exclusions]

                for filename in files_to_process:
                    full_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(full_path, project_path)
                    
                    # Normalizacja separatorów dla spójności (ważne na Windows)
                    relative_path = relative_path.replace('\\', '/')

                    print(f"Przetwarzanie: {relative_path}")

                    # Zapisz ścieżkę do pliku jako nagłówek w Markdown
                    md_file.write(f"--- \n\n")
                    md_file.write(f"## `{relative_path}`\n\n")

                    # Zidentyfikuj język dla podświetlania składni
                    lang = get_language_from_extension(filename)
                    md_file.write(f"```{lang}\n")

                    # Odczytaj i zapisz zawartość pliku
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f_in:
                            content = f_in.read()
                            md_file.write(content)
                    except Exception as e:
                        md_file.write(f"Nie udało się odczytać pliku: {e}")
                    
                    md_file.write(f"\n```\n\n")

    except IOError as e:
        print(f"Błąd zapisu do pliku '{output_file}': {e}")
    except Exception as e:
        print(f"Wystąpił nieoczekiwany błąd: {e}")

    print(f"\nUkończono! Mapa projektu została zapisana w pliku: {output_file}")


def main():
    """Główna funkcja do obsługi argumentów wiersza poleceń."""
    parser = argparse.ArgumentParser(
        description="Tworzy mapę projektu, łącząc wszystkie pliki w jeden plik Markdown.",
        formatter_class=argparse.RawTextHelpFormatter # Lepsze formatowanie pomocy
    )
    
    parser.add_argument(
        'path',
        type=str,
        help='Ścieżka do katalogu projektu, który ma zostać zmapowany.'
    )
    
    parser.add_argument(
        '-o', '--output',
        type=str,
        default='project_map.md',
        help='Nazwa pliku wyjściowego .md (domyślnie: project_map.md).'
    )
    
    parser.add_argument(
        '-e', '--exclude',
        nargs='+',  # Pozwala na podanie wielu wartości
        default=[],
        help='Dodatkowe nazwy katalogów lub plików do wykluczenia (oddzielone spacjami).\n'
             f"Domyślne wykluczenia to: {', '.join(DEFAULT_EXCLUSIONS)}"
    )

    args = parser.parse_args()
    
    # Połącz domyślne wykluczenia z tymi podanymi przez użytkownika
    all_exclusions = DEFAULT_EXCLUSIONS.union(set(args.exclude))

    map_project_to_md(args.path, args.output, all_exclusions)


if __name__ == '__main__':
    main()