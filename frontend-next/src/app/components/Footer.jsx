export default function Footer() {
  return (
    <footer className="footer footer-center p-4 bg-base-200 text-base-content">
      <aside>
        <p className="text-sm opacity-70">
          © {new Date().getFullYear()} Ethical Product Finder. Minimal & Modern.
        </p>
      </aside>
    </footer>
  );
}
