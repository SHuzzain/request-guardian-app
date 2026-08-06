"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMastersData,
  saveDepartment,
  deleteDepartmentAction,
  saveRole,
  deleteRoleAction,
  saveRequestType,
  deleteRequestTypeAction,
} from "@/feature/masters/actions/masters.actions";
import { ROLE_PERMISSION_GROUPS, type RolePermissions } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Building2,
  Shield,
  FileCode,
  Users,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

export function MastersView() {
  const [activeTab, setActiveTab] = useState<"departments" | "roles" | "requestTypes" | "users">("departments");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Pagination states (5 per page)
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Edit / Add Modal States
  const [deptModal, setDeptModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [roleModal, setRoleModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [typeModal, setTypeModal] = useState<{ open: boolean; item?: any }>({ open: false });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "department" | "role" | "requestType";
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["masters-data"],
    queryFn: () => getMastersData(),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Filtered Items per Tab
  const filteredDepts = data.departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredRoles = data.roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredTypes = data.requestTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredUsers = data.users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination Slice
  const paginate = (items: any[]) => {
    const totalPages = Math.ceil(items.length / pageSize) || 1;
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    return {
      pagedItems: items.slice(start, start + pageSize),
      totalPages,
      currentPage,
    };
  };

  // Permission Checkbox Toggle Helper
  const togglePermission = (sectionKey: string, actionKey: string) => {
    setRolePermissions((prev: Record<string, string[]>) => {
      const currentList: string[] = prev[sectionKey] || [];
      const hasPerm = currentList.includes(actionKey);
      const newList = hasPerm
        ? currentList.filter((a) => a !== actionKey)
        : [...currentList, actionKey];

      return {
        ...prev,
        [sectionKey]: newList,
      };
    });
  };

  // Handlers
  const handleSaveDeptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const description = fd.get("description") as string;
    if (!name?.trim()) return;

    setLoading(true);
    try {
      await saveDepartment({ id: deptModal.item?.id, name, description });
      toast.success(deptModal.item ? "Department updated" : "Department added");
      setDeptModal({ open: false });
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const description = fd.get("description") as string;
    if (!name?.trim()) return;

    setLoading(true);
    try {
      await saveRole({
        id: roleModal.item?.id,
        name,
        description,
        permissions: rolePermissions,
      });
      toast.success(roleModal.item ? "Role updated" : "Role added");
      setRoleModal({ open: false });
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTypeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const code = fd.get("code") as string;
    const maxAmount = Number(fd.get("maxAmount") || 0);
    if (!name?.trim() || !code?.trim()) return;

    setLoading(true);
    try {
      await saveRequestType({
        id: typeModal.item?.id,
        name,
        code: code.toUpperCase(),
        maxAmount,
      });
      toast.success(typeModal.item ? "Request type updated" : "Request type added");
      setTypeModal({ open: false });
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save request type");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      if (deleteConfirm.type === "department") await deleteDepartmentAction(deleteConfirm.id);
      else if (deleteConfirm.type === "role") await deleteRoleAction(deleteConfirm.id);
      else if (deleteConfirm.type === "requestType") await deleteRequestTypeAction(deleteConfirm.id);
      toast.success(`${deleteConfirm.name} deleted`);
      setDeleteConfirm(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "departments", label: `Departments (${data.departments.length})`, icon: Building2 },
    { id: "roles", label: `Roles (${data.roles.length})`, icon: Shield },
    { id: "requestTypes", label: `Request Types (${data.requestTypes.length})`, icon: FileCode },
    { id: "users", label: `Users (${data.users.length})`, icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Masters Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure departments, roles, request types, permissions, and users.
        </p>
      </div>

      {/* Controls Bar: Tabs Left + Search & Add Button Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setPage(1);
                }}
                className={`pb-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search items..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {activeTab === "departments" && (
            <button
              onClick={() => setDeptModal({ open: true })}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Dept
            </button>
          )}

          {activeTab === "roles" && (
            <button
              onClick={() => {
                setRolePermissions({});
                setRoleModal({ open: true });
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Role
            </button>
          )}

          {activeTab === "requestTypes" && (
            <button
              onClick={() => setTypeModal({ open: true })}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Type
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === "departments" && (() => {
        const { pagedItems, totalPages, currentPage } = paginate(filteredDepts);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedItems.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{d.name}</td>
                    <td className="p-3.5"><span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Active</span></td>
                    <td className="p-3.5 text-slate-400">{formatDate(d.createdAt)}</td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-1">
                      <button onClick={() => setDeptModal({ open: true, item: d })} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ open: true, type: "department", id: d.id, name: d.name })} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 2: Roles */}
      {activeTab === "roles" && (() => {
        const { pagedItems, totalPages, currentPage } = paginate(filteredRoles);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Role Name</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedItems.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="p-3.5 text-slate-500">{r.description || "—"}</td>
                    <td className="p-3.5"><span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Active</span></td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setRolePermissions((r.permissions as any) || {});
                          setRoleModal({ open: true, item: r });
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ open: true, type: "role", id: r.id, name: r.name })} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 3: Request Types */}
      {activeTab === "requestTypes" && (() => {
        const { pagedItems, totalPages, currentPage } = paginate(filteredTypes);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedItems.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{t.name}</td>
                    <td className="p-3.5 text-blue-600 font-mono font-bold">{t.code}</td>
                    <td className="p-3.5"><span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Active</span></td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-1">
                      <button onClick={() => setTypeModal({ open: true, item: t })} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ open: true, type: "requestType", id: t.id, name: t.name })} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 4: Users */}
      {activeTab === "users" && (() => {
        const { pagedItems, totalPages, currentPage } = paginate(filteredUsers);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedItems.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{u.fullName}</td>
                    <td className="p-3.5 text-slate-500">{u.email}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{u.department || "—"}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{u.role || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Department Add / Edit */}
      {deptModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveDeptSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {deptModal.item ? "Edit Department" : "Add Department"}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
              <input type="text" name="name" defaultValue={deptModal.item?.name ?? ""} required className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeptModal({ open: false })} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Role Add / Edit + Interactive Permission Matrix */}
      {roleModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveRoleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {roleModal.item ? "Edit Role & Permissions" : "Add Role & Permissions"}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Name *</label>
              <input type="text" name="name" defaultValue={roleModal.item?.name ?? ""} required className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input type="text" name="description" defaultValue={roleModal.item?.description ?? ""} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>

            {/* Permission Matrix Tree */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Role Permission Matrix
              </span>
              <div className="space-y-3">
                {ROLE_PERMISSION_GROUPS.map((group) => (
                  <div key={group.key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">{group.label}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                      {group.sections.map((section) => (
                        <div key={section.key} className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">{section.label}</span>
                          <div className="space-y-1">
                            {section.actions.map((perm) => {
                              const isChecked = (rolePermissions[section.key] || []).includes(perm.key);
                              return (
                                <label key={perm.key} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(section.key, perm.key)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setRoleModal({ open: false })} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">Save Role</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Request Type Add / Edit */}
      {typeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveTypeSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {typeModal.item ? "Edit Request Type" : "Add Request Type"}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input type="text" name="name" defaultValue={typeModal.item?.name ?? ""} required className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Code (e.g. TRV) *</label>
              <input type="text" name="code" defaultValue={typeModal.item?.code ?? ""} required className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Amount (₹)</label>
              <input type="number" name="maxAmount" defaultValue={typeModal.item?.maxAmount ?? ""} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTypeModal({ open: false })} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      {deleteConfirm && deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">!</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete {deleteConfirm.name}?</h3>
            <p className="text-xs text-slate-500">Are you sure you want to delete this master record? This action cannot be undone.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={executeDelete} disabled={loading} className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
