export default function Footer() {
  return (
    <footer className="w-full rounded-t-xl bg-surface-container-low mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="font-jua text-2xl text-on-surface">FairyWeave</div>
          <p className="text-sm font-medium text-secondary max-w-xs text-center md:text-left">
            소중한 우리 아이를 위한 세상에 하나뿐인 동화책
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <span className="text-sm font-medium text-secondary">
            서비스 소개
          </span>
          <span className="text-sm font-medium text-secondary">
            배송 안내
          </span>
          <span className="text-sm font-medium text-secondary">
            개인정보처리방침
          </span>
          <span className="text-sm font-medium text-secondary">
            고객센터
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
