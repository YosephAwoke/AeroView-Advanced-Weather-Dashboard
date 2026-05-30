export default function Footer() {
  return (
    <footer className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 glass-panel px-4 py-2 rounded-full flex items-center gap-4 text-sm">
      <div className="text-textSecondary">Made with <span className="text-rose-500">❤️</span> by Yoseph Awoke</div>
      <div className="flex items-center gap-3">
        <a href="mailto:yosephawoke8@gmail.com" className="text-accent hover:underline" aria-label="Email">yosephawoke8@gmail.com</a>
        <a href="https://www.linkedin.com/in/yosephawoke/" target="_blank" rel="noreferrer" className="text-accent hover:underline" aria-label="LinkedIn">LinkedIn</a>
        <a href="https://github.com/YosephAwoke" target="_blank" rel="noreferrer" className="text-accent hover:underline" aria-label="GitHub">GitHub</a>
      </div>
    </footer>
  );
}
