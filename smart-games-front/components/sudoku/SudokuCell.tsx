import { Cell } from "./SudokuBoard"

type SudokuCellProps = {
    cell: Cell
    active: string
    onClick: () => void
}

export const SudokuCell = ({
    cell,
    active,
    onClick,
}: SudokuCellProps) => {

    return (
        <div
            className={`${active} ${cell.invalid ? "invalid" : ""} ${cell.readonly ? "readonly" : ""}`}
            onClick={onClick}
        >
            {cell.value ? (
                cell.value
            ) : (
                <div className="notes-grid">
                    {Array.from({ length: 9 }, (_, i) => {
                        const note = i + 1

                        return (
                            <span key={note}>
                                {cell.notes?.includes(note) ? note : ""}
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )
}