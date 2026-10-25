export type Cell = {
  value: number | null
  readonly: boolean
  invalid?: boolean
  notes?: number[]
}

export type Board = Cell[][]

export type Difficulty = "easy" | "medium" | "hard"
