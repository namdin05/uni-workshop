import { Link } from 'react-router-dom';
import { loadSession } from '../api/auth';

export default function StudentHome() {
  const session = loadSession();
  const profileName = session?.profile?.full_name || 'Student';

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section - Vùng giới thiệu chính */}
      <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        {/* Background Gradients & Blur Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-20 pointer-events-none" 
             style={{ background: 'radial-gradient(circle, var(--tw-colors-primary-fixed, #0055ff) 0%, transparent 60%)', filter: 'blur(80px)' }} 
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-8 z-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-sm font-semibold text-primary shadow-sm">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Welcome to Student Portal
          </span>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1]">
            Unlock Your Potential <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Through Learning</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant leading-relaxed">
            Hello, <span className="font-semibold text-on-surface">{profileName}</span>. 
            Discover inspiring workshops, connect with industry experts, and track your academic growth all in one beautifully designed space.
          </p>

          {/* Hai nút chức năng chính */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link 
              to="/workshops" 
              className="ui-btn ui-btn-primary w-full sm:w-[240px] h-14 inline-flex items-center justify-center gap-2 rounded-2xl px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-1 hover:shadow-primary/40"
            >
              <span className="material-symbols-outlined text-[20px]">explore</span>
              Browse Workshops
            </Link>
            <Link 
              to="/tickets" 
              className="ui-btn ui-btn-surface w-full sm:w-[240px] h-14 inline-flex items-center justify-center gap-2 rounded-2xl px-8 text-base font-semibold border border-outline-variant shadow-sm transition-all hover:bg-surface-container hover:-translate-y-1"
            >
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
              View My Tickets
            </Link>
          </div>
        </div>
      </section>

      {/* Feature / Giới thiệu tính năng */}
      <section className="py-20 bg-surface-container-lowest border-t border-outline-variant/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">Everything you need to succeed</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Our platform is designed to seamlessly integrate into your academic life, making it easier than ever to participate in extracurricular learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Thẻ giới thiệu 1 */}
            <div className="p-8 rounded-3xl bg-surface border border-outline-variant/50 transition-colors hover:border-primary/30">
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed/20 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">explore</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">Discover New Topics</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Explore a curated catalog of workshops ranging from technology and design to leadership and soft skills.
              </p>
            </div>

            {/* Thẻ giới thiệu 2 */}
            <div className="p-8 rounded-3xl bg-surface border border-outline-variant/50 transition-colors hover:border-primary/30">
              <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/20 text-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">Easy Check-ins</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Forget paper tickets. Use your personalized QR code to instantly check into any registered session.
              </p>
            </div>

            {/* Thẻ giới thiệu 3 */}
            <div className="p-8 rounded-3xl bg-surface border border-outline-variant/50 transition-colors hover:border-primary/30">
              <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed/20 text-tertiary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">Earn Certificates</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Build your resume. Automatically receive digital certificates of completion after attending verified workshops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Text Khuyến khích */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-6">Ready to start learning?</h2>
          <p className="text-lg text-on-surface-variant mb-10">
            Join thousands of other students who are already upgrading their skills. The next great workshop is just a click away.
          </p>
          <Link 
            to="/workshops" 
            className="inline-flex items-center gap-2 rounded-full bg-on-surface px-8 py-4 text-base font-semibold text-surface transition-transform hover:scale-105"
          >
            Explore Catalog
          </Link>
        </div>
      </section>
    </main>
  );
}