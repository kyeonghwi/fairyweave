export default function Footer() {
  return (
    <footer className="w-full rounded-t-xl bg-surface-container-low mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-jua text-2xl text-on-surface">FairyWeave</div>
          <p className="text-sm font-medium text-secondary">
            Hand-crafted with magic for the ones you love most.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Our Story
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Shipping
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Privacy
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Help
          </span>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">share</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">favorite</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
