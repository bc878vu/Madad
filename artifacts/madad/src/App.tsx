import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  getGetCurrentUserQueryKey,
  getListPostsQueryKey,
  useAddComment,
  useCreatePost,
  useGetCurrentUser,
  useHealthCheck,
  useListPosts,
  useLoginUser,
  useLogoutUser,
  useOfferHelp,
  useRegisterUser,
  useReportPost,
} from '@workspace/api-client-react';
import type { Post, User } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const categories = ['Education', 'Work', 'Community', 'Medical', 'Housing', 'General'];

type InfoKey = 'about' | 'mission' | 'vision' | 'goals' | 'how' | 'safety' | 'guidelines' | 'privacy' | 'terms' | 'faq' | 'contact';
type Action = { kind: 'offer' | 'comment' | 'report'; post: Post } | null;

const infoData: Record<InfoKey, { eyebrow: string; title: string; intro: string; sections: [string, string][] }> = {
  about: {
    eyebrow: 'ABOUT MADAD',
    title: 'Practical help, made easier to find.',
    intro: 'MADAD is a community platform designed to help people share genuine needs, discover practical support and create meaningful connections safely.',
    sections: [['What we believe', 'Small acts of support can create real change. MADAD gives people a clear place to ask, offer and coordinate help across everyday needs.'], ['What we do', 'We organize community needs into clear categories, make requests easier to understand and help contributors respond with context.'], ['Our commitment', 'We are building a respectful, accessible and safety-conscious community where people remain in control of what they share.']],
  },
  mission: {
    eyebrow: 'OUR MISSION',
    title: 'Turn everyday needs into practical action.',
    intro: 'Our mission is to reduce the distance between someone needing help and someone able to offer it.',
    sections: [['Connect', 'Make relevant needs easier to discover.'], ['Enable', 'Give people simple tools to ask for and offer practical help.'], ['Protect', 'Promote respectful participation, reporting and safer community interactions.']],
  },
  vision: {
    eyebrow: 'OUR VISION',
    title: 'A more connected world, one helpful action at a time.',
    intro: 'We envision communities where asking for help is easier, offering help is more visible and meaningful support can begin with a simple conversation.',
    sections: [['Accessible support', 'Useful help should not be difficult to discover.'], ['Human connection', 'Technology should make communities feel more connected, not less.'], ['Responsible growth', 'Trust, safety and clarity must grow alongside the platform.']],
  },
  goals: {
    eyebrow: 'GOALS & AIMS',
    title: 'Built around measurable, practical impact.',
    intro: 'MADAD focuses on making community support easier to understand, safer to navigate and more useful in real life.',
    sections: [['Make needs visible', 'Present requests in clear categories with useful context.'], ['Encourage responsible help', 'Support respectful communication and transparent expectations.'], ['Strengthen trust', 'Provide reporting, moderation and clear community standards.'], ['Improve continuously', 'Use feedback to refine the product, safety systems and user experience.']],
  },
  how: {
    eyebrow: 'HOW IT WORKS',
    title: 'From one message to meaningful support.',
    intro: 'MADAD keeps the process simple while giving each interaction enough context to be useful.',
    sections: [['1. Share a need', 'Create a clear request and choose the category that best fits it.'], ['2. Get discovered', 'Community members can browse, search and filter requests.'], ['3. Start a conversation', 'People who can help can respond and coordinate respectfully.'], ['4. Stay responsible', 'Use reporting tools and follow community guidelines throughout the interaction.']],
  },
  safety: {
    eyebrow: 'SAFETY & TRUST',
    title: 'Help should never require ignoring your safety.',
    intro: 'Use good judgment, protect your personal information and take extra care when moving conversations or meetings offline.',
    sections: [['Share less, not more', 'Only provide the personal details needed for a specific interaction.'], ['Verify before acting', 'Independently verify important claims before sending money, documents or sensitive information.'], ['Meet carefully', 'For offline exchanges, prefer appropriate public settings and involve trusted people when needed.'], ['Report problems', 'Use platform reporting when behavior violates our rules or creates a safety concern.']],
  },
  guidelines: {
    eyebrow: 'COMMUNITY GUIDELINES',
    title: 'A helpful community needs clear boundaries.',
    intro: 'These standards apply to everyone using MADAD.',
    sections: [['Be respectful', 'Do not harass, threaten, discriminate against or humiliate others.'], ['Be honest', 'Do not impersonate people or misrepresent a need, offer or identity.'], ['Protect privacy', 'Do not publish private information without permission.'], ['Keep requests appropriate', 'Do not use MADAD for unlawful, dangerous or exploitative activity.'], ['Report concerns', 'If something appears unsafe or suspicious, use the reporting tools.']],
  },
  privacy: {
    eyebrow: 'PRIVACY POLICY',
    title: 'Privacy information, in plain language.',
    intro: 'MADAD collects and processes information needed to operate accounts, provide platform features, improve reliability and protect the community.',
    sections: [['Information you provide', 'This can include account details and content you choose to submit.'], ['How information is used', 'Information may be used to operate, secure and improve MADAD and respond to requests.'], ['Your choices', 'Avoid posting unnecessary sensitive information and contact us regarding account-related requests.'], ['Policy updates', 'This policy may change as the platform evolves. Material changes should be reflected on this page.']],
  },
  terms: {
    eyebrow: 'TERMS OF SERVICE',
    title: 'Clear rules for using MADAD.',
    intro: 'By using MADAD, you agree to use the platform responsibly and in accordance with applicable law and our community standards.',
    sections: [['Your account', 'You are responsible for information submitted through your account and for protecting account access.'], ['Platform content', 'You must have the right to post content you submit and must not violate others’ rights.'], ['No guaranteed outcome', 'MADAD helps people discover and coordinate support but cannot guarantee that any request will receive help.'], ['Enforcement', 'Content or accounts may be restricted when required to protect users or enforce these terms.']],
  },
  faq: {
    eyebrow: 'HELP CENTER',
    title: 'Answers that make MADAD easier to use.',
    intro: 'A practical guide for sharing a need, offering help and using the community safely.',
    sections: [['How do I share a need?', 'Create an account, select the option to post a need, choose the most relevant category and explain your request clearly.'], ['Who can respond to my post?', 'Community members can discover public requests and use available platform actions to offer help or start a respectful conversation.'], ['How do I report something?', 'Use the Report action on relevant content and provide useful context. Reports can then be reviewed through the platform moderation workflow.'], ['Is MADAD a guarantee of help?', 'No. MADAD helps people discover and coordinate practical support, but a successful outcome cannot be guaranteed.'], ['How can I protect my privacy?', 'Share only information needed for the request. Avoid posting passwords, financial credentials, identity documents or other unnecessary sensitive information.']],
  },
  contact: {
    eyebrow: 'CONTACT & SUPPORT',
    title: 'Questions, feedback or a safety concern?',
    intro: 'We want MADAD to be useful and understandable. Contact us with product feedback, account questions or concerns about community activity.',
    sections: [['General support', 'Use the in-app reporting and account tools where available for the fastest context.'], ['Safety concerns', 'If there is an immediate emergency, contact relevant local emergency services first.'], ['Feedback', 'Tell us what works, what does not and what would make MADAD more useful.']],
  },
};

function Brand() {
  return <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark" aria-hidden="true">M</span><span>MADAD</span></Link>;
}

function Shell({ children, onCreate }: { children: ReactNode; onCreate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), staleTime: 60_000 } });
  const logout = useLogoutUser();
  const client = useQueryClient();
  const user = session?.user;
  const nav = [['Explore', '/explore'], ['Categories', '/categories'], ['How it works', '/how-it-works'], ['Safety', '/safety']];

  const signOut = () => {
    logout.mutate(undefined, { onSuccess: () => { client.setQueryData(getGetCurrentUserQueryKey(), { user: null }); setLocation('/'); } });
  };

  return <div className="page">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <button className="menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu">{menuOpen ? '×' : '≡'}</button>
        <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}
          <div className="header-actions">
            {user ? <><span className="user-chip"><span className="avatar">{initials(user)}</span><span>{user.displayName || user.username}</span></span><button className="button button-ghost" onClick={signOut} data-testid="button-signout">Sign out</button></> : <Link href="/signin" className="button button-ghost" data-testid="link-signin">Sign in</Link>}
            <button className="button button-primary" onClick={onCreate} data-testid="button-header-create">{user ? 'Post a need' : 'Join MADAD'}</button>
          </div>
        </nav>
      </div>
    </header>
    <main id="main-content">{children}</main>
    <Footer />
  </div>;
}

function Footer() {
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'], staleTime: 120_000 } });
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand"><Brand /><p>A more helpful world starts with one message.</p><small>Built for practical help and stronger communities.</small></div>
        <FooterGroup title="Platform" links={[['Explore', '/explore'], ['Categories', '/categories'], ['How it works', '/how-it-works'], ['Safety & trust', '/safety'], ['Guidelines', '/guidelines']]} />
        <FooterGroup title="MADAD" links={[['About', '/about'], ['Mission', '/mission'], ['Vision', '/vision'], ['Goals & aims', '/goals'], ['FAQ', '/faq']]} />
        <FooterGroup title="Legal & support" links={[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact'], ['Sign in', '/signin']]} />
        <div className="footer-location"><strong>Find MADAD</strong><span>Lahore, Pakistan</span><Link href="/contact">Contact & support →</Link><small>Support details are kept current on the contact page.</small></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} MADAD. Built around people.</span><span>{health.isSuccess ? 'Community systems online' : 'A global community for practical help.'}</span></div>
    </div>
  </footer>;
}

function FooterGroup({ title, links }: { title: string; links: string[][] }) {
  return <div className="footer-column"><strong>{title}</strong>{links.map(([label, href]) => <Link key={href} href={href} data-testid={`link-footer-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}</div>;
}

function initials(user?: Pick<User, 'username' | 'displayName'> | { username?: string; displayName?: string }) {
  const value = user?.displayName || user?.username || 'M';
  return value.slice(0, 1).toUpperCase();
}

function HomePage({ onCreate, onAction }: { onCreate: () => void; onAction: (action: Exclude<Action, null>) => void }) {
  return <>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">A GLOBAL COMMUNITY FOR PRACTICAL HELP</span>
          <h1>One message can <em>start a chain of help.</em></h1>
          <p>Share what you need. Discover people who can help. Build a kinder, more connected world — safely.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={onCreate} data-testid="button-hero-create">Post your need <span aria-hidden="true">→</span></button><Link href="/explore" className="text-link" data-testid="link-hero-explore">Explore the community</Link></div>
          <div className="hero-trust"><span>Human connections</span><span>Community moderation</span><span>Practical support</span></div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a connected community">
          <div className="orbit"><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /><div className="visual-card"><span className="mini-label">A request, made human</span><h3>Looking for a used laptop for my studies</h3><p>Education · Lahore, Pakistan</p></div></div>
        </div>
      </div>
    </section>
    <section className="section section-tinted">
      <div className="container">
        <div className="section-header"><div><span className="eyebrow">WHY MADAD</span><h2>Support with more context.</h2><p>Designed for the moments when a practical answer matters more than another scroll.</p></div><Link href="/about" className="text-link">Learn about MADAD →</Link></div>
        <div className="feature-grid"><div className="feature-card feature-main"><span className="feature-number">01</span><div><h3>Real needs, clearly shared.</h3><p>Every request carries enough context for a person to understand what would genuinely help.</p></div></div><div className="feature-card"><span className="feature-number">02</span><div><h3>Human-scale discovery.</h3><p>Browse by category and place, without turning people into content.</p></div></div><div className="feature-card"><span className="feature-number">03</span><div><h3>Trust by design.</h3><p>Clear guidance, reporting and thoughtful boundaries for safer connections.</p></div></div></div>
      </div>
    </section>
    <FeedSection compact onCreate={onCreate} onAction={onAction} />
    <section className="section">
      <div className="container"><span className="eyebrow">HOW MADAD WORKS</span><h2>Simple to use.<br />Built around people.</h2><div className="steps"><div className="step"><span className="step-number">01</span><h3>Share a need</h3><p>Describe what you need clearly and choose the category that fits best.</p></div><div className="step"><span className="step-number">02</span><h3>Connect safely</h3><p>People from the community can respond, comment and offer practical help.</p></div><div className="step"><span className="step-number">03</span><h3>Make an impact</h3><p>One useful connection can solve a problem and start a chain of support.</p></div></div></div>
    </section>
  </>;
}

function FeedPage({ onCreate, onAction }: { onCreate: () => void; onAction: (action: Exclude<Action, null>) => void }) {
  return <FeedSection onCreate={onCreate} onAction={onAction} />;
}

function FeedSection({ compact = false, onCreate, onAction }: { compact?: boolean; onCreate: () => void; onAction: (action: Exclude<Action, null>) => void }) {
  const [location] = useLocation();
  const initialCategory = new URLSearchParams(location.split('?')[1] || '').get('category') || 'All';
  const [category, setCategory] = useState(initialCategory);
  useEffect(() => {
    const fromQuery = new URLSearchParams(location.split('?')[1] || '').get('category');
    if (fromQuery && categories.includes(fromQuery)) setCategory(fromQuery);
  }, [location]);
  const params = useMemo(() => ({ ...(category === 'All' ? {} : { category }), limit: 50 }), [category]);
  const postsQuery = useListPosts(params, { query: { queryKey: getListPostsQueryKey(params), staleTime: 30_000 } });
  const posts = postsQuery.data?.posts ?? [];
  return <section className={compact ? 'section' : 'section'} id="feed">
    <div className="container">
      <div className="section-header"><div><span className="eyebrow">{compact ? 'COMMUNITY FEED' : 'LIVE COMMUNITY FEED'}</span><h2>People helping people.</h2><p>Real needs. Real people. Small actions that can make a meaningful difference.</p></div><button className="button button-primary" onClick={onCreate} data-testid="button-create-post">+ Create post</button></div>
      <div className="feed-layout">
        <aside className="filter-list" aria-label="Filter requests"><h3>Explore</h3><button className={category === 'All' ? 'filter selected' : 'filter'} onClick={() => setCategory('All')} data-testid="filter-all">All requests</button>{categories.map(item => <button key={item} className={category === item ? 'filter selected' : 'filter'} onClick={() => setCategory(item)} data-testid={`filter-${item.toLowerCase()}`}>{item}</button>)}</aside>
        <div className="feed-list">
          {postsQuery.isLoading && <><div className="skeleton" /><div className="skeleton" /></>}
          {postsQuery.isError && <div className="state-card"><h3>We could not load the requests.</h3><p>The community feed is having a quiet moment. Please try again.</p><button className="button button-secondary" onClick={() => postsQuery.refetch()}>Try again</button></div>}
          {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 && <div className="state-card"><h3>No requests here yet.</h3><p>Be the first person to ask for or offer practical help in this category.</p><button className="button button-primary" onClick={onCreate}>Create a post</button></div>}
          {!postsQuery.isLoading && !postsQuery.isError && posts.map(post => <PostCard key={post.id} post={post} onAction={onAction} />)}
        </div>
      </div>
    </div>
  </section>;
}

function PostCard({ post, onAction }: { post: Post; onAction: (action: Exclude<Action, null>) => void }) {
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), staleTime: 60_000 } });
  const openAction = (kind: Exclude<Action, null>['kind']) => {
    if (!session?.user) { setLocation('/signin'); return; }
    onAction({ kind, post });
  };
  return <article className="post-card" data-testid={`card-post-${post.id}`}>
    <div className="post-top"><div className="author"><span className="avatar">{initials(post.author)}</span><div><div className="author-name" data-testid={`text-author-${post.id}`}>{post.author?.username || 'Community member'}</div><div className="author-location">{[post.city, post.country].filter(Boolean).join(', ') || 'Location not shared'}</div></div></div><span className="post-time">{relativeDate(post.createdAt)}</span></div>
    <div className="tags"><span className="tag">{post.category}</span><span className="tag tag-status">{post.status}</span></div>
    <h3>{post.title}</h3><p className="body">{post.content}</p>
    <div className="post-actions"><button className="action-button" onClick={() => openAction('offer')} data-testid={`button-help-${post.id}`}>I can help <strong>{post._count?.helpOffers ?? 0}</strong></button><button className="action-button" onClick={() => openAction('comment')} data-testid={`button-comment-${post.id}`}>Comment <strong>{post._count?.comments ?? 0}</strong></button><button className="action-button report" onClick={() => openAction('report')} data-testid={`button-report-${post.id}`}>Report</button></div>
  </article>;
}

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function CategoriesPage() {
  const descriptions: Record<string, string> = { Education: 'Learning tools, school access and study support.', Work: 'Skills, opportunities and the next step in a career.', Community: 'Local needs, neighbors and shared resources.', Medical: 'Practical support around health and care.', Housing: 'A safer place to live, move or settle.', General: 'Everyday needs that do not fit one label.' };
  return <><section className="subpage-hero"><div className="container"><span className="eyebrow">EXPLORE BY CATEGORY</span><h1>Find the kind of help you can give.</h1><p>Start with a category, then read the full story behind each request. The right contribution often begins with noticing.</p></div></section><section className="container"><div className="category-grid">{categories.map((item, index) => <Link href={`/posts?category=${item}`} className="category-card" key={item} data-testid={`link-category-${item.toLowerCase()}`}><span className="category-icon">0{index + 1}</span><div><h2>{item}</h2><p>{descriptions[item]}</p></div></Link>)}</div></section></>;
}

function CreatePage() {
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const create = useCreatePost();
  const client = useQueryClient();
  const [form, setForm] = useState({ title: '', content: '', category: 'General', country: '', city: '' });
  const [error, setError] = useState('');
  const user = session?.user;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!user) { setLocation('/signin?next=/create'); return; }
    if (form.title.trim().length < 5 || form.content.trim().length < 10) { setError('Add a little more detail so the community can understand your request.'); return; }
    setError('');
    create.mutate({ data: { ...form, country: form.country || undefined, city: form.city || undefined } }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListPostsQueryKey() }); setLocation('/posts'); }, onError: errorValue => setError(readError(errorValue)) });
  };
  return <section className="container create-layout"><div><span className="eyebrow">CREATE A REQUEST</span><h1>What do you need help with?</h1><p className="create-intro">Keep it clear, specific and easy for another person to understand. A thoughtful request gives the right person a better way to step in.</p>{!user && <div className="success-note" style={{ marginTop: 22 }}>Sign in to publish a request. Your draft will stay on this page while you sign in.</div>}<form className="create-form" onSubmit={submit}><div className="field"><label htmlFor="post-title">Title</label><input id="post-title" data-testid="input-post-title" value={form.title} maxLength={120} placeholder="For example: Looking for a used laptop for my studies" onChange={event => setForm({ ...form, title: event.target.value })} /></div><div className="field"><label htmlFor="post-content">Tell the community what you need</label><textarea id="post-content" data-testid="input-post-content" value={form.content} maxLength={1200} placeholder="Share useful context, what you have tried and what kind of support would make a difference." onChange={event => setForm({ ...form, content: event.target.value })} /></div><div className="field"><label htmlFor="post-category">Category</label><select id="post-category" data-testid="select-post-category" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{categories.map(item => <option value={item} key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="post-city">City or area <span className="muted">(optional)</span></label><input id="post-city" value={form.city} maxLength={80} placeholder="Lahore" onChange={event => setForm({ ...form, city: event.target.value })} /></div><div className="field"><label htmlFor="post-country">Country <span className="muted">(optional)</span></label><input id="post-country" value={form.country} maxLength={80} placeholder="Pakistan" onChange={event => setForm({ ...form, country: event.target.value })} /></div>{error && <div className="error-note" data-testid="status-create-error">{error}</div>}<button className="button button-primary button-block" disabled={create.isPending} data-testid="button-publish-post">{create.isPending ? 'Publishing request…' : 'Publish request →'}</button></form></div><aside className="aside-note"><h3>Write for a person.</h3><p>The strongest requests help someone picture the situation without asking you to reveal more than you need to.</p><ul><li>Say what would make a difference.</li><li>Leave out passwords and sensitive documents.</li><li>Choose a category that feels closest.</li></ul></aside></section>;
}

function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLoginUser();
  const register = useRegisterUser();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (isSignup) {
      if (form.username.length < 3 || form.password.length < 8) { setError('Choose a username with at least 3 characters and a password with at least 8.'); return; }
      register.mutate({ data: { email: form.email, username: form.username, password: form.password, displayName: form.displayName || undefined } }, { onSuccess: result => { client.setQueryData(getGetCurrentUserQueryKey(), { user: result.user }); setLocation('/'); }, onError: errorValue => setError(readError(errorValue)) });
    } else {
      login.mutate({ data: { email: form.email, password: form.password } }, { onSuccess: result => { client.setQueryData(getGetCurrentUserQueryKey(), { user: result.user }); setLocation('/'); }, onError: errorValue => setError(readError(errorValue)) });
    }
  };
  return <section className="form-page container"><div className="form-card"><span className="eyebrow">{isSignup ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</span><h1>{isSignup ? 'Join MADAD.' : 'Welcome back.'}</h1><p>{isSignup ? 'Create an account and make practical help easier to find.' : 'Sign in to keep helping and connecting with the community.'}</p><form className="form-fields" onSubmit={submit}>{isSignup && <><div className="field"><label htmlFor="display-name">Display name <span className="muted">(optional)</span></label><input id="display-name" data-testid="input-display-name" autoComplete="name" value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} placeholder="How people should see you" /></div><div className="field"><label htmlFor="username">Username</label><input id="username" data-testid="input-username" autoComplete="username" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} placeholder="Choose a username" /></div></>}<div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" data-testid="input-email" type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div><div className="field"><label htmlFor="auth-password">Password</label><input id="auth-password" data-testid="input-password" required type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder={isSignup ? 'At least 8 characters' : 'Your password'} /></div>{error && <div className="error-note" data-testid="status-auth-error">{error}</div>}<button className="button button-primary button-block" disabled={login.isPending || register.isPending} data-testid="button-submit-auth">{login.isPending || register.isPending ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button></form><div className="form-note">{isSignup ? <>Already have an account? <Link href="/signin">Sign in</Link></> : <>New to MADAD? <Link href="/signup">Create an account</Link></>}</div></div></section>;
}

function ActionDialog({ action, onClose, onNotice }: { action: Action; onClose: () => void; onNotice: (message: string) => void }) {
  const client = useQueryClient();
  const [text, setText] = useState('');
  const offer = useOfferHelp();
  const comment = useAddComment();
  const report = useReportPost();
  useEffect(() => { setText(''); }, [action]);
  if (!action) return null;
  const pending = offer.isPending || comment.isPending || report.isPending;
  const submit = () => {
    if (action.kind === 'comment' && !text.trim()) return;
    if (action.kind === 'offer') offer.mutate({ postId: action.post.id, data: text.trim() ? { message: text.trim() } : undefined }, { onSuccess: () => done('Your offer to help was sent.'), onError: value => onNotice(readError(value)) });
    if (action.kind === 'comment') comment.mutate({ postId: action.post.id, data: { content: text.trim() } }, { onSuccess: () => done('Your comment was added.'), onError: value => onNotice(readError(value)) });
    if (action.kind === 'report') report.mutate({ postId: action.post.id, data: { reason: text.trim() || 'Community safety concern' } }, { onSuccess: () => done('Thanks. The report was submitted for review.'), onError: value => onNotice(readError(value)) });
  };
  const done = (message: string) => { client.invalidateQueries({ queryKey: getListPostsQueryKey() }); onClose(); onNotice(message); };
  const copy = action.kind === 'offer' ? ['OFFER PRACTICAL HELP', 'A short note can make your offer more useful.'] : action.kind === 'comment' ? ['ADD A HELPFUL COMMENT', 'Keep the conversation respectful and useful.'] : ['REPORT THIS REQUEST', 'Tell the moderation team what needs attention.'];
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title"><button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button><span className="eyebrow">{copy[0]}</span><h2 id="action-dialog-title">{action.kind === 'offer' ? 'I can help.' : action.kind === 'comment' ? 'Add your perspective.' : 'Keep the community safe.'}</h2><p>{copy[1]}</p><div className="field"><label htmlFor="action-message">{action.kind === 'report' ? 'What should we know?' : 'Message'} {action.kind === 'offer' && <span className="muted">(optional)</span>}</label><textarea id="action-message" autoFocus value={text} maxLength={action.kind === 'report' ? 160 : 800} placeholder={action.kind === 'offer' ? 'What kind of support can you offer?' : action.kind === 'comment' ? 'Write something useful…' : 'Describe the issue…'} onChange={event => setText(event.target.value)} /></div><button className="button button-primary button-block" disabled={pending} onClick={submit}>{pending ? 'Submitting…' : action.kind === 'offer' ? 'Send offer' : action.kind === 'comment' ? 'Post comment' : 'Submit report'}</button></div></div>;
}

function InfoPage({ page }: { page: InfoKey }) {
  const data = infoData[page];
  return <><section className="subpage-hero"><div className="container"><span className="eyebrow">{data.eyebrow}</span><h1>{data.title}</h1><p>{data.intro}</p></div></section><section className="container"><div className="info-grid">{data.sections.map(([title, text], index) => <article className="info-item" key={title}><span className="item-number">{String(index + 1).padStart(2, '0')}</span><h2>{title}</h2><p>{text}</p></article>)}</div>{page === 'contact' && <div className="contact-panel"><div><span className="eyebrow">LOCATION & ACCESS</span><h2>Start with a message. Continue with the right support.</h2><p>MADAD is built for community access from Lahore, Pakistan and beyond. For product or safety questions, use the platform tools or the contact page.</p><div className="contact-details"><div><strong>Location</strong><span>Lahore, Pakistan</span></div><div><strong>Support</strong><span>Available through MADAD contact tools</span></div></div></div><div className="map-card"><iframe title="MADAD location in Lahore" src="https://www.openstreetmap.org/export/embed.html?bbox=74.2%2C31.45%2C74.45%2C31.7&layer=mapnik" loading="lazy" /><a href="https://www.openstreetmap.org/?mlat=31.55&mlon=74.35#map=11/31.55/74.35" target="_blank" rel="noreferrer">Open map ↗</a></div></div>}<div className="subpage-cta"><span className="eyebrow">READY TO TAKE PART?</span><h2>One useful connection can start with one message.</h2><Link href="/explore" className="button button-primary">Explore the community →</Link></div></section></>;
}

function AppRouter() {
  const [, setLocation] = useLocation();
  const [action, setAction] = useState<Action>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(timer); }, [notice]);
  const create = () => setLocation('/create');
  const openAction = (nextAction: Exclude<Action, null>) => setAction(nextAction);
  return <Shell onCreate={create}><Switch>
    <Route path="/" component={() => <HomePage onCreate={create} onAction={openAction} />} />
    <Route path="/explore" component={() => <FeedPage onCreate={create} onAction={openAction} />} />
    <Route path="/posts" component={() => <FeedPage onCreate={create} onAction={openAction} />} />
    <Route path="/categories" component={CategoriesPage} />
    <Route path="/create" component={CreatePage} />
    <Route path="/signin" component={() => <AuthPage mode="signin" />} />
    <Route path="/signup" component={() => <AuthPage mode="signup" />} />
    {(Object.keys(infoData) as InfoKey[]).map(page => <Route key={page} path={`/${page === 'how' ? 'how-it-works' : page}`} component={() => <InfoPage page={page} />} />)}
    <Route component={NotFound} />
  </Switch>{action && <ActionDialog action={action} onClose={() => setAction(null)} onNotice={setNotice} />}{notice && <div className="toast" role="status" data-testid="status-toast">{notice}</div>}</Shell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><AppRouter /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function readError(error: unknown) {
  if (error && typeof error === 'object') {
    if ('error' in error) return String((error as { error: unknown }).error);
    if ('data' in error && error.data && typeof error.data === 'object' && 'error' in error.data) return String((error.data as { error: unknown }).error);
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export default App;