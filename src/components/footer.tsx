export function Footer() {
  return (
    <footer className="mx-auto flex min-h-24 w-[min(1180px,calc(100%_-_2rem))] items-center justify-between gap-4 border-t border-white/7 text-xs text-muted-foreground max-sm:flex-col max-sm:items-start max-sm:justify-center">
      <span>© {new Date().getFullYear()} Ivan Radev</span>
      <span>Local inference · Local browser storage</span>
    </footer>
  );
}
