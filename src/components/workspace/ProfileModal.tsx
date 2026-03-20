import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';
import {
  X, User, Mail, Key, Bell, Palette, Globe, Shield,
  Copy, CheckCheck, ChevronRight, Sparkles, LogOut, Camera,
} from 'lucide-react';

type ProfileTab = 'profile' | 'appearance' | 'notifications' | 'api-keys' | 'account';

const MOCK_USER = {
  name: 'Alex Rivera',
  email: 'alex@synapse.ai',
  plan: 'Pro',
  avatar: null as null | string,
  memberSince: 'Jan 2024',
  totalWorkflows: 12,
  totalRuns: 847,
};

const TABS: { id: ProfileTab; icon: typeof User; label: string }[] = [
  { id: 'profile',       icon: User,     label: 'Profile' },
  { id: 'appearance',   icon: Palette,  label: 'Appearance' },
  { id: 'notifications',icon: Bell,     label: 'Notifications' },
  { id: 'api-keys',     icon: Key,      label: 'API Keys' },
  { id: 'account',      icon: Shield,   label: 'Account' },
];

// ─── Avatar with edit overlay ─────────────────────────────────────────────────
function AvatarUpload({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className="relative group w-20 h-20 shrink-0">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-syn-violet/40 to-syn-teal/20 flex items-center justify-center ring-2 ring-syn-violet/30">
        <span className="text-2xl font-display font-bold text-foreground">{initials}</span>
      </div>
      <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
        <Camera className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

// ─── API Key Row ──────────────────────────────────────────────────────────────
function ApiKeyRow({ label, value, provider }: { label: string; value: string; provider: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-3 rounded-xl bg-syn-raised border border-syn-border hover:border-syn-border-active transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[12px] font-ui font-medium text-foreground">{label}</div>
          <div className="text-[10px] text-syn-text-muted font-ui">{provider}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVisible(!visible)}
            className="h-6 px-2 text-[10px] font-ui bg-syn-hover rounded text-syn-text-secondary hover:text-foreground transition-all"
          >
            {visible ? 'Hide' : 'Reveal'}
          </button>
          <button
            onClick={handleCopy}
            className="w-6 h-6 flex items-center justify-center rounded text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
          >
            {copied ? <CheckCheck className="w-3 h-3 text-syn-teal" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <code className="block text-[11px] font-mono text-syn-text-code bg-syn-hover px-2 py-1.5 rounded-md overflow-hidden">
        {visible ? value : value.slice(0, 6) + '•'.repeat(32)}
      </code>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-syn-border/50 last:border-0">
      <div>
        <div className="text-[13px] font-ui text-foreground">{label}</div>
        {desc && <div className="text-[11px] text-syn-text-muted font-ui mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'w-10 h-6 rounded-full transition-all duration-200 relative shrink-0',
          value ? 'bg-syn-violet' : 'bg-syn-border-active'
        )}
      >
        <span className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
          value ? 'left-5' : 'left-1'
        )} />
      </button>
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Avatar + basic info */}
      <div className="flex items-start gap-4">
        <AvatarUpload name={name} />
        <div className="flex-1 space-y-3">
          <div>
            <label className="text-[11px] font-ui text-syn-text-secondary block mb-1">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 text-[13px] font-ui bg-syn-raised border border-syn-border rounded-lg text-foreground focus:outline-none focus:border-syn-violet transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-ui text-syn-text-secondary block mb-1">Email Address</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-9 px-3 text-[13px] font-ui bg-syn-raised border border-syn-border rounded-lg text-foreground focus:outline-none focus:border-syn-violet transition-all"
            />
          </div>
        </div>
      </div>

      {/* Plan badge */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-syn-violet/10 to-syn-teal/5 border border-syn-violet/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-syn-violet/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-syn-violet" />
          </div>
          <div>
            <div className="text-[13px] font-display font-semibold text-foreground">{MOCK_USER.plan} Plan</div>
            <div className="text-[11px] text-syn-text-muted font-ui">Member since {MOCK_USER.memberSince}</div>
          </div>
        </div>
        <button className="h-7 px-3 text-[11px] font-ui bg-syn-violet text-white rounded-lg hover:brightness-110 transition-all">
          Upgrade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-syn-raised border border-syn-border text-center">
          <div className="text-2xl font-display font-bold text-foreground">{MOCK_USER.totalWorkflows}</div>
          <div className="text-[11px] text-syn-text-muted font-ui mt-0.5">Workflows</div>
        </div>
        <div className="p-3 rounded-xl bg-syn-raised border border-syn-border text-center">
          <div className="text-2xl font-display font-bold text-foreground">{MOCK_USER.totalRuns}</div>
          <div className="text-[11px] text-syn-text-muted font-ui mt-0.5">Total Runs</div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={cn(
          'w-full h-9 rounded-lg text-[13px] font-display font-semibold transition-all',
          saved
            ? 'bg-syn-teal/20 text-syn-teal border border-syn-teal/30'
            : 'bg-syn-violet text-white hover:brightness-110 shadow-[0_0_16px_rgba(108,99,255,0.3)]'
        )}
      >
        {saved ? '✓ Changes Saved' : 'Save Profile'}
      </button>
    </div>
  );
}

// ─── Appearance tab ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const { theme, toggle } = useTheme();
  const [compact, setCompact] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [grid, setGrid] = useState(true);

  const themes = [
    { id: 'dark', label: 'Dark', desc: 'Easy on the eyes', gradient: 'from-[#090B10] to-[#111420]' },
    { id: 'light', label: 'Light', desc: 'Bright & clean', gradient: 'from-[#f0f2f5] to-[#ffffff]' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted mb-3">Theme</div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { if (theme !== t.id) toggle(); }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all text-left',
                theme === t.id
                  ? 'border-syn-violet shadow-[0_0_0_4px_rgba(108,99,255,0.15)]'
                  : 'border-syn-border hover:border-syn-border-active'
              )}
            >
              <div className={cn('h-12 rounded-lg bg-gradient-to-br mb-3', t.gradient)} />
              <div className="text-[13px] font-ui font-medium text-foreground">{t.label}</div>
              <div className="text-[11px] text-syn-text-muted font-ui">{t.desc}</div>
              {theme === t.id && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-syn-violet flex items-center justify-center">
                  <CheckCheck className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted mb-2">Interface</div>
        <div className="rounded-xl border border-syn-border overflow-hidden">
          <ToggleRow label="Compact Mode" desc="Reduce spacing throughout the UI" value={compact} onChange={setCompact} />
          <ToggleRow label="Animations" desc="Motion effects on nodes and transitions" value={animations} onChange={setAnimations} />
          <ToggleRow label="Show Minimap" desc="Minimap preview in canvas corner" value={minimap} onChange={setMinimap} />
          <ToggleRow label="Snap to Grid" desc="Align nodes to 16px grid" value={grid} onChange={setGrid} />
        </div>
      </div>
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [runComplete, setRunComplete] = useState(true);
  const [runError, setRunError] = useState(true);
  const [collab, setCollab] = useState(true);
  const [tips, setTips] = useState(false);
  const [browser, setBrowser] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted mb-2">In-App</div>
        <div className="rounded-xl border border-syn-border overflow-hidden">
          <ToggleRow label="Workflow Run Complete" desc="Toast when a run finishes" value={runComplete} onChange={setRunComplete} />
          <ToggleRow label="Execution Errors" desc="Alert on node failure" value={runError} onChange={setRunError} />
          <ToggleRow label="Collaboration Activity" desc="When teammates join or edit" value={collab} onChange={setCollab} />
          <ToggleRow label="Tips & Tricks" desc="Periodic feature hints" value={tips} onChange={setTips} />
        </div>
      </div>
      <div>
        <div className="text-[11px] font-ui uppercase tracking-widest text-syn-text-muted mb-2">Browser</div>
        <div className="rounded-xl border border-syn-border overflow-hidden">
          <ToggleRow label="Browser Notifications" desc="Push notifications when tab is hidden" value={browser} onChange={setBrowser} />
        </div>
      </div>
    </div>
  );
}

// ─── API Keys tab ─────────────────────────────────────────────────────────────
function ApiKeysTab() {
  return (
    <div className="space-y-3">
      <p className="text-[12px] font-ui text-syn-text-muted">
        API keys are stored securely and never exposed in the UI after creation.
      </p>
      <ApiKeyRow label="OpenAI" provider="openai.com" value="sk-proj-xKJh8mQpLtRvN3wZ2aY1cU5bX7dFgE9iOlPjMsT6nAkBv4qReDhWuCyI0f" />
      <ApiKeyRow label="Anthropic" provider="anthropic.com" value="sk-ant-api03-KpMxQr8nLjW2vZ5yT9aB4cDhE1fGiJ7kN0oP3qRsU6wX" />
      <ApiKeyRow label="Groq" provider="groq.com" value="gsk_KmN3pQ8rLjW2xZ5yT9aB4cDhE1fG7iJ0kN3oP6qRsU9wX" />
      <button className="w-full h-9 rounded-xl border border-dashed border-syn-border-active text-[12px] font-ui text-syn-text-secondary hover:border-syn-violet hover:text-syn-violet hover:bg-syn-violet/5 transition-all flex items-center justify-center gap-2">
        + Add new API key
      </button>
    </div>
  );
}

// ─── Account tab ──────────────────────────────────────────────────────────────
function AccountTab({ onClose }: { onClose: () => void }) {
  const { addToast } = useWorkflowStore();

  const handleSignOut = () => {
    addToast({ type: 'info', message: 'Signed out successfully' });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-syn-raised border border-syn-border space-y-3">
        <div className="flex justify-between text-[13px] font-ui">
          <span className="text-syn-text-secondary">Account ID</span>
          <span className="font-mono text-[11px] text-syn-text-code">usr_a1b2c3d4e5f6</span>
        </div>
        <div className="flex justify-between text-[13px] font-ui">
          <span className="text-syn-text-secondary">Plan</span>
          <span className="text-syn-violet font-medium">Pro — $29/mo</span>
        </div>
        <div className="flex justify-between text-[13px] font-ui">
          <span className="text-syn-text-secondary">Next billing</span>
          <span className="text-foreground">Apr 1, 2026</span>
        </div>
        <div className="flex justify-between text-[13px] font-ui">
          <span className="text-syn-text-secondary">Runs used</span>
          <span className="text-foreground">847 / unlimited</span>
        </div>
      </div>

      <button className="w-full h-9 rounded-xl bg-syn-raised border border-syn-border text-[13px] font-ui text-syn-text-secondary hover:bg-syn-hover transition-all flex items-center justify-between px-4">
        <span>Manage subscription</span>
        <ChevronRight className="w-4 h-4" />
      </button>
      <button className="w-full h-9 rounded-xl bg-syn-raised border border-syn-border text-[13px] font-ui text-syn-text-secondary hover:bg-syn-hover transition-all flex items-center justify-between px-4">
        <span>Export all data</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="pt-2 border-t border-syn-border space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full h-9 rounded-xl bg-syn-raised border border-syn-border text-[13px] font-ui text-syn-text-secondary hover:bg-syn-amber/10 hover:text-syn-amber hover:border-syn-amber/30 transition-all flex items-center gap-2 px-4"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <button className="w-full h-9 rounded-xl bg-syn-raised border border-syn-red/20 text-[13px] font-ui text-syn-red/70 hover:bg-syn-red/10 hover:text-syn-red transition-all flex items-center justify-between px-4">
          <span>Delete account</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main ProfileModal ─────────────────────────────────────────────────────────
export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-[680px] max-h-[85vh] rounded-2xl border border-syn-border-active shadow-[0_40px_120px_rgba(0,0,0,0.75)] flex overflow-hidden animate-fade-in-up"
        style={{ background: 'hsl(var(--bg-raised))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar nav */}
        <div className="w-44 shrink-0 border-r border-syn-border p-3 flex flex-col gap-1"
          style={{ background: 'hsl(var(--bg-surface))' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-2 mb-4 mt-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-syn-violet/40 to-syn-teal/20 flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-foreground">
                {MOCK_USER.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-ui font-medium text-foreground truncate">{MOCK_USER.name}</div>
              <div className="text-[10px] text-syn-text-muted font-ui truncate">{MOCK_USER.plan}</div>
            </div>
          </div>

          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12px] font-ui transition-all text-left',
                activeTab === id
                  ? 'bg-syn-violet/15 text-syn-violet border border-syn-violet/25'
                  : 'text-syn-text-secondary hover:bg-syn-hover hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}

          {/* Version */}
          <div className="mt-auto pt-3 border-t border-syn-border px-2">
            <div className="text-[9px] font-ui text-syn-text-muted">Synapse v1.0.0</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-syn-border">
            <h2 className="text-[14px] font-display font-bold text-foreground">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-syn-text-muted hover:text-foreground hover:bg-syn-hover transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'profile'        && <ProfileTab />}
            {activeTab === 'appearance'     && <AppearanceTab />}
            {activeTab === 'notifications'  && <NotificationsTab />}
            {activeTab === 'api-keys'       && <ApiKeysTab />}
            {activeTab === 'account'        && <AccountTab onClose={onClose} />}
          </div>
        </div>
      </div>
    </div>
  );
}
