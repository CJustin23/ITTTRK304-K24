import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LogOut, Search, ShieldCheck, UserRound, Users, UserX, DatabaseBackup, RotateCcw, Trash2, Pencil } from 'lucide-react';
import { AdminBackup, AdminService, AdminStats, AdminUser, ChatbotApiKey } from '../services/api';
import { Role } from '../types';
import { useStore } from '../store/useStore';

type AdminTab = 'overview' | 'accounts' | 'families' | 'chatbot' | 'backups';
const roles: { value: Role; label: string }[] = [
  { value: 'INDIVIDUAL_USER', label: 'Cá nhân' },
  { value: 'FAMILY_ADMIN', label: 'Chủ hộ' },
  { value: 'FAMILY_MEMBER', label: 'Thành viên hộ' },
  { value: 'SYSTEM_ADMIN', label: 'Quản trị hệ thống' },
];

const getErrorMessage = (error: any) => error?.response?.data?.message || error?.response?.data?.error || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';

export const AdminView: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<number, { role: Role; group: string }>>({});
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [keys, setKeys] = useState<ChatbotApiKey[]>([]);
  const [provider, setProvider] = useState('Gemini');
  const [apiKey, setApiKey] = useState('');
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<number, string>>({});
  const [backups, setBackups] = useState<AdminBackup[]>([]);
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreChallenge, setRestoreChallenge] = useState<{ name: string; token: string; phrase: string } | null>(null);
  const [restorePhrase, setRestorePhrase] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await AdminService.getUsers());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const loadStats = useCallback(async () => {
    try { setStats(await AdminService.getStats()); } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  const loadKeys = useCallback(async () => {
    try { setKeys(await AdminService.getChatbotKeys()); } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  const loadBackups = useCallback(async () => {
    try { setBackups(await AdminService.getBackups()); } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'chatbot') void loadKeys(); }, [tab, loadKeys]);
  useEffect(() => { if (tab === 'backups') void loadBackups(); }, [tab, loadBackups]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return users;
    return users.filter((user) => `${user.fullName} ${user.email} ${user.familyGroupId || ''}`.toLocaleLowerCase().includes(term));
  }, [users, query]);

  const groupCount = new Set(users.map((user) => user.familyGroupId).filter(Boolean)).size;
  const navigation: { id: AdminTab; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', description: 'Chỉ số vận hành hệ thống', icon: <CheckCircle2 /> },
    { id: 'accounts', label: 'Tài khoản', description: 'Tìm kiếm và phân quyền', icon: <UserRound /> },
    { id: 'families', label: 'Nhóm hộ', description: 'Danh sách và chủ hộ', icon: <Users /> },
    { id: 'chatbot', label: 'Chatbot API Key', description: 'Cấu hình nhà cung cấp', icon: <KeyRound /> },
    { id: 'backups', label: 'Sao lưu dữ liệu', description: 'Backup và khôi phục', icon: <DatabaseBackup /> },
  ];
  const activeNavigation = navigation.find((item) => item.id === tab) || navigation[0];
  const selectableOwners = users.filter((user) =>
    user.enabled !== false && user.role !== 'SYSTEM_ADMIN' && user.familyGroupId == null
  );

  const saveRole = async (user: AdminUser) => {
    const draft = roleDrafts[user.id] || { role: user.role, group: user.familyGroupId || '' };
    if ((draft.role === 'FAMILY_ADMIN' || draft.role === 'FAMILY_MEMBER') && !draft.group.trim()) {
      setError('Vai trò hộ gia đình cần có mã nhóm hộ.');
      return;
    }
    setBusyId(user.id); setError(''); setNotice('');
    try {
      const updated = await AdminService.updateRole(user.id, draft.role, draft.group.trim());
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setRoleDrafts((items) => { const next = { ...items }; delete next[user.id]; return next; });
      setNotice(`Đã cập nhật vai trò cho ${updated.fullName}.`);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  const toggleStatus = async (user: AdminUser) => {
    const enabled = user.enabled === false;
    const action = enabled ? 'mở khoá' : 'khoá';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.email}?`)) return;
    setBusyId(user.id); setError(''); setNotice('');
    try {
      const updated = await AdminService.updateStatus(user.id, enabled);
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Đã ${enabled ? 'mở khoá' : 'khoá'} tài khoản ${updated.email}.`);
      await loadStats();
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice(''); setCreatingGroup(true);
    try {
      const result = await AdminService.createFamilyGroup({ id: groupCode.trim(), name: groupName.trim(), ownerId: Number(ownerId) });
      setNotice(`Đã tạo nhóm ${result.name || groupName.trim()} (${result.id || groupCode.trim()}).`);
      setGroupCode(''); setGroupName(''); setOwnerId('');
      await Promise.all([loadUsers(), loadStats()]);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setCreatingGroup(false); }
  };

  const submitKey = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      if (editingKey) await AdminService.updateChatbotKey(editingKey, provider, apiKey);
      else await AdminService.createChatbotKey(provider, apiKey);
      setProvider('Gemini'); setApiKey(''); setEditingKey(null); setNotice('Đã lưu cấu hình API key chatbot.'); await loadKeys();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const revealKey = async (id: number) => {
    if (revealedKeys[id]) { setRevealedKeys((items) => { const next = { ...items }; delete next[id]; return next; }); return; }
    try { const revealed = await AdminService.revealChatbotKey(id); setRevealedKeys((items) => ({ ...items, [id]: revealed })); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const createBackup = async () => {
    setBackupBusy(true); setError(''); setNotice('');
    try { const created = await AdminService.createBackup(); setNotice(`Đã tạo bản backup ${created.name}.`); await loadBackups(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBackupBusy(false); }
  };

  const prepareRestore = async (name: string) => {
    if (!window.confirm(`Chuẩn bị khôi phục từ ${name}? Bước này chưa thay đổi dữ liệu.`)) return;
    try { const challenge = await AdminService.prepareRestore(name); setRestoreChallenge({ name, token: challenge.token, phrase: challenge.requiredConfirmation }); setRestorePhrase(''); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const confirmRestore = async () => {
    if (!restoreChallenge || restorePhrase !== restoreChallenge.phrase) return;
    setBackupBusy(true); setError(''); setNotice('');
    try { await AdminService.restoreBackup(restoreChallenge.name, restoreChallenge.token, restorePhrase); setNotice(`Đã khôi phục từ ${restoreChallenge.name}.`); setRestoreChallenge(null); await Promise.all([loadUsers(), loadStats(), loadBackups()]); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBackupBusy(false); }
  };

  if (currentUser?.role !== 'SYSTEM_ADMIN') {
    return <section className="max-w-2xl mx-auto mt-12 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
      <h1 className="mt-4 text-xl font-bold text-slate-900">Bạn không có quyền truy cập</h1>
      <p className="mt-2 text-sm text-slate-500">Trang này chỉ dành cho quản trị viên hệ thống.</p>
    </section>;
  }

  return <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-xl font-bold text-white shadow-md shadow-emerald-500/20">B</div>
          <div><p className="font-bold leading-tight text-slate-900">Budglee</p><p className="text-xs text-slate-500">Quản trị nền tảng</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:inline-flex"><ShieldCheck className="h-4 w-4" />SYSTEM_ADMIN</span>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>
      </div>
    </header>
    <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6">
      <div className="hidden px-3 pb-3 pt-2 lg:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Không gian quản trị</p>
      </div>
      <nav aria-label="Chức năng quản trị" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navigation.map((item) => {
          const selected = tab === item.id;
          return <button key={item.id} aria-current={selected ? 'page' : undefined} onClick={() => setTab(item.id)} className={`group flex min-w-max flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors lg:w-full lg:flex-none ${selected ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>{React.cloneElement(item.icon as React.ReactElement, { className: 'h-4 w-4' })}</span>
            <span className="min-w-0"><span className="block text-sm font-bold">{item.label}</span><span className={`mt-0.5 hidden text-[11px] lg:block ${selected ? 'text-emerald-700/75' : 'text-slate-400'}`}>{item.description}</span></span>
          </button>;
        })}
      </nav>
      <div className="mt-4 hidden rounded-xl bg-slate-50 p-3 lg:block"><p className="text-xs font-bold text-slate-700">Quyền quản trị hệ thống</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Dữ liệu tài chính cá nhân được bảo vệ và không hiển thị trong khu vực này.</p></div>
    </aside>

    <div className="min-w-0 space-y-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Vận hành nền tảng</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{activeNavigation.label}</h1>
        <p className="mt-2 text-sm text-slate-500">{tab === 'overview' ? 'Quản lý nền tảng Budglee. Nội dung tài chính của người dùng không hiển thị tại đây.' : activeNavigation.description}</p>
      </div>
      {tab === 'accounts' && <label className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Tìm tài khoản" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, email, mã nhóm..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>}
    </div>

    {tab === 'overview' && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={<UserRound />} label="Tổng tài khoản" value={stats?.totalAccounts ?? users.length} />
      <SummaryCard icon={<UserX />} label="Tài khoản đã khóa" value={stats?.disabledAccounts ?? users.filter((user) => user.enabled === false).length} />
      <SummaryCard icon={<Users />} label="Nhóm hộ" value={stats?.familyGroups ?? groupCount} />
      <SummaryCard icon={<CheckCircle2 />} label="Giao dịch 24 giờ" value={stats?.transactionsLast24Hours ?? 0} />
    </div>}

    {(error || notice) && <div role="status" className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
    </div>}

    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {tab === 'overview' ? <div className="grid gap-5 p-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5"><h2 className="font-bold">Vận hành nền tảng</h2><p className="mt-2 text-sm text-slate-600">Số liệu chỉ là tổng số, không hiển thị thông tin tài chính cá nhân. Các thao tác quản trị được giới hạn cho SYSTEM_ADMIN.</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">Bảo vệ dữ liệu</p><p className="mt-2 text-sm text-emerald-800">API key được mã hóa khi lưu. Restore cần xác nhận hai bước và chỉ chấp nhận file backup hợp lệ.</p></div>
      </div> : tab === 'accounts' ? <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Tài khoản</th><th className="px-4 py-3">Mã nhóm</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Đang tải tài khoản...</td></tr> : filteredUsers.map((user) => {
              const draft = roleDrafts[user.id] || { role: user.role, group: user.familyGroupId || '' };
              const changed = draft.role !== user.role || draft.group !== (user.familyGroupId || '');
              return <tr key={user.id} className="align-top hover:bg-slate-50/70">
                <td className="px-5 py-4"><p className="font-semibold text-slate-900">{user.fullName}</p><p className="mt-0.5 text-xs text-slate-500">{user.email} · #{user.id}</p></td>
                <td className="px-4 py-4"><input aria-label={`Mã nhóm hộ của ${user.email}`} value={draft.group} onChange={(e) => setRoleDrafts((items) => ({ ...items, [user.id]: { ...draft, group: e.target.value } }))} placeholder="Không thuộc nhóm" className="w-40 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-500" /></td>
                <td className="px-4 py-4"><select aria-label={`Vai trò của ${user.email}`} value={draft.role} onChange={(e) => setRoleDrafts((items) => ({ ...items, [user.id]: { ...draft, role: e.target.value as Role } }))} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-emerald-500">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></td>
                <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.enabled === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.enabled === false ? 'Đã khoá' : 'Hoạt động'}</span></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2">{changed && <button disabled={busyId === user.id} onClick={() => void saveRole(user)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Lưu vai trò</button>}<button disabled={busyId === user.id} onClick={() => void toggleStatus(user)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${user.enabled === false ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}><UserX className="h-3.5 w-3.5" />{user.enabled === false ? 'Mở khoá' : 'Khoá'}</button></div></td>
              </tr>;
            })}
            {!loading && filteredUsers.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Không tìm thấy tài khoản phù hợp.</td></tr>}
          </tbody>
        </table>
      </div> : tab === 'families' ? <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div><h2 className="font-bold text-slate-900">Nhóm hộ đã có</h2><p className="mt-1 text-sm text-slate-500">Danh sách nhóm được tổng hợp từ tài khoản thành viên.</p>
          <div className="mt-4 space-y-2">{Array.from(new Set(users.map((user) => user.familyGroupId).filter((id): id is string => Boolean(id)))).sort().map((id) => <div key={id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><span className="font-mono text-sm font-semibold text-slate-800">{id}</span><span className="text-xs text-slate-500">{users.filter((user) => user.familyGroupId === id).length} thành viên</span></div>)}{groupCount === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có nhóm hộ.</p>}</div>
        </div>
        <form onSubmit={(e) => void createGroup(e)} className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div><h2 className="font-bold text-slate-900">Tạo nhóm hộ</h2><p className="mt-1 text-sm text-slate-500">Chủ hộ được gán vai FAMILY_ADMIN ngay khi tạo.</p></div>
          <Field label="Mã nhóm"><input required maxLength={50} value={groupCode} onChange={(e) => setGroupCode(e.target.value)} placeholder="VD: GD-NGUYEN-01" className={inputClass} /></Field>
          <Field label="Tên nhóm"><input required maxLength={100} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Gia đình Nguyễn" className={inputClass} /></Field>
          <Field label="Chủ hộ"><select required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}><option value="">Chọn tài khoản</option>{selectableOwners.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select></Field>
          <button disabled={creatingGroup || selectableOwners.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{creatingGroup && <LoaderCircle className="h-4 w-4 animate-spin" />}Tạo nhóm hộ</button>
        </form>
      </div> : tab === 'chatbot' ? <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">API Key</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{keys.map((key) => <tr key={key.id}><td className="px-4 py-4 font-semibold">{key.provider}</td><td className="px-4 py-4 font-mono text-xs">{revealedKeys[key.id] || key.maskedKey}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${key.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{key.active ? 'Đang dùng' : 'Tắt'}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button aria-label="Hiện hoặc che key" onClick={() => void revealKey(key.id)} className="rounded-lg border p-2 text-slate-600">{revealedKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => void AdminService.toggleChatbotKey(key.id, !key.active).then(loadKeys).catch((e) => setError(getErrorMessage(e)))} className="rounded-lg border px-2 py-1 text-xs">{key.active ? 'Tắt' : 'Bật'}</button><button onClick={() => { setEditingKey(key.id); setProvider(key.provider); setApiKey(''); }} className="rounded-lg border p-2 text-slate-600" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => { if (window.confirm(`Xóa API key của ${key.provider}?`)) void AdminService.deleteChatbotKey(key.id).then(loadKeys).catch((e) => setError(getErrorMessage(e))); }} className="rounded-lg border border-rose-200 p-2 text-rose-600" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}{keys.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">Chưa có API key chatbot.</td></tr>}</tbody></table></div>
        <form onSubmit={(e) => void submitKey(e)} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-bold">{editingKey ? 'Cập nhật API key' : 'Thêm API key'}</h2><Field label="Provider"><input required maxLength={80} value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} placeholder="Gemini, OpenAI..." /></Field><Field label={editingKey ? 'Key mới' : 'API Key'}><input required type="password" maxLength={4096} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} autoComplete="new-password" /></Field><p className="text-xs text-slate-500">Key được mã hóa khi lưu; danh sách chỉ hiển thị dạng che.</p><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"><KeyRound className="h-4 w-4" />{editingKey ? 'Lưu thay đổi' : 'Thêm key'}</button>{editingKey && <button type="button" onClick={() => { setEditingKey(null); setApiKey(''); }} className="w-full text-sm text-slate-500">Hủy sửa</button>}</form>
      </div> : <div className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Bản sao lưu cơ sở dữ liệu</h2><p className="mt-1 text-sm text-slate-500">Danh sách file backup thực tế. Restore thay thế dữ liệu hiện tại.</p></div><button disabled={backupBusy} onClick={() => void createBackup()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><DatabaseBackup className="h-4 w-4" />Tạo backup</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Tên file</th><th className="px-4 py-3">Dung lượng</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{backups.map((backup) => <tr key={backup.name}><td className="px-4 py-4 font-mono text-xs">{backup.name}</td><td className="px-4 py-4">{(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB</td><td className="px-4 py-4">{new Date(backup.createdAt).toLocaleString('vi-VN')}</td><td className="px-4 py-4 text-right"><button onClick={() => void prepareRestore(backup.name)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800"><RotateCcw className="h-3.5 w-3.5" />Khôi phục</button></td></tr>)}{backups.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">Chưa có bản backup.</td></tr>}</tbody></table></div>
        {restoreChallenge && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold text-rose-700">Xác nhận khôi phục dữ liệu</h2><p className="text-sm text-slate-600">Sẽ thay thế dữ liệu hiện tại bằng <strong>{restoreChallenge.name}</strong>. Nhập chính xác cụm xác nhận bên dưới để tiếp tục.</p><code className="block rounded-lg bg-slate-100 p-3 text-sm font-bold">{restoreChallenge.phrase}</code><input value={restorePhrase} onChange={(e) => setRestorePhrase(e.target.value)} className={inputClass} aria-label="Cụm xác nhận khôi phục" /><div className="flex justify-end gap-2"><button onClick={() => setRestoreChallenge(null)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button><button disabled={backupBusy || restorePhrase !== restoreChallenge.phrase} onClick={() => void confirmRestore()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{backupBusy ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}</button></div></div></div>}
      </div>}
      {tab === 'accounts' && <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Hiển thị {filteredUsers.length} / {users.length} tài khoản</div>}
    </section>
    </div>
    </main>
  </div>;
};

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">{React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}</span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div></div>;
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block text-xs font-semibold text-slate-700">{label}{children}</label>;
