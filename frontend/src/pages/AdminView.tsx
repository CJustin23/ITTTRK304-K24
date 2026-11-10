import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, LogOut, Search, ShieldCheck, UserRound, Users, UserX } from 'lucide-react';
import { AdminService, AdminUser } from '../services/api';
import { Role } from '../types';
import { useStore } from '../store/useStore';

type AdminTab = 'accounts' | 'families';
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
  const [tab, setTab] = useState<AdminTab>('accounts');
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

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return users;
    return users.filter((user) => `${user.fullName} ${user.email} ${user.familyGroupId || ''}`.toLocaleLowerCase().includes(term));
  }, [users, query]);

  const enabledCount = users.filter((user) => user.enabled !== false).length;
  const groupCount = new Set(users.map((user) => user.familyGroupId).filter(Boolean)).size;
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
      await loadUsers();
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setCreatingGroup(false); }
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
    <main className="mx-auto max-w-[1440px] space-y-7 px-5 py-8 sm:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Vận hành nền tảng</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quản trị hệ thống</h1>
        <p className="mt-2 text-sm text-slate-500">Quản lý tài khoản và nhóm hộ. Nội dung tài chính của người dùng không hiển thị tại đây.</p>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard icon={<UserRound />} label="Tổng tài khoản" value={users.length} />
      <SummaryCard icon={<CheckCircle2 />} label="Đang hoạt động" value={enabledCount} />
      <SummaryCard icon={<Users />} label="Nhóm hộ đang dùng" value={groupCount} />
    </div>

    {(error || notice) && <div role="status" className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
    </div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex gap-2">
          <TabButton selected={tab === 'accounts'} onClick={() => setTab('accounts')}>Tài khoản</TabButton>
          <TabButton selected={tab === 'families'} onClick={() => setTab('families')}>Nhóm hộ</TabButton>
        </div>
        {tab === 'accounts' && <label className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Tìm tài khoản" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, email, mã nhóm..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>}
      </div>

      {tab === 'accounts' ? <div className="overflow-x-auto">
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
      </div> : <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
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
      </div>}
      {tab === 'accounts' && <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Hiển thị {filteredUsers.length} / {users.length} tài khoản</div>}
    </section>
    </main>
  </div>;
};

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">{React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}</span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div></div>;
const TabButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${selected ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{children}</button>;
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block text-xs font-semibold text-slate-700">{label}{children}</label>;
