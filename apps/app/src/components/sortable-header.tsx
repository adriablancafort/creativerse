import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Column } from "@tanstack/react-table"

export function SortableHeader<TData>({
  column,
  title,
}: {
  column: Column<TData>
  title: string
}) {
  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 select-none"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <HugeiconsIcon
          icon={ArrowUp01Icon}
          strokeWidth={2}
          className="size-4"
        />
      ) : sorted === "desc" ? (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4"
        />
      ) : (
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          className="size-4"
        />
      )}
    </button>
  )
}
