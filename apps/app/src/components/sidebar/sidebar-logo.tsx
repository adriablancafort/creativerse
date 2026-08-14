import { Link } from "@tanstack/react-router"

export function SidebarLogo() {
  return (
    <Link
      to="/"
      draggable={false}
      className="flex items-center gap-2 px-2 py-3 rounded-lg select-none"
    >
      <img
        src="/logo.svg"
        alt="Creativerse Logo"
        draggable={false}
        className="size-7 dark:invert"
      />
      <span className="truncate text-2xl">Creativerse</span>
    </Link>
  )
}
