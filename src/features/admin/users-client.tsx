"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwoColumnFormSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { UserPicker } from "@/components/ui/user-picker";
import { apiFetch, type PublicUser } from "@/lib/api/client";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  lineManagerName: string | null;
  authMethod: string;
  status: string;
  inviteStatus: string | null;
};

type ListResponse = { items: UserRow[]; total: number };

export function AdminUsersClient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lineManagerId, setLineManagerId] = useState("");
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [remindCreatePlan, setRemindCreatePlan] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingLineManagerId, setEditingLineManagerId] = useState<string | null>(null);
  const [lineManagerDraft, setLineManagerDraft] = useState("");

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<PublicUser>("/auth/me"),
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () =>
      apiFetch<ListResponse>(`/admin/users?q=${encodeURIComponent(q)}&page=1&pageSize=50`),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch("/admin/users", {
        method: "POST",
        json: {
          fullName,
          email,
          jobTitle: jobTitle || undefined,
          lineManagerId: lineManagerId || null,
          role,
          remindCreatePlan,
        },
      }),
    onSuccess: async () => {
      toast.success("Invitation sent", `${fullName} will receive an activation email.`);
      setFullName("");
      setEmail("");
      setJobTitle("");
      setLineManagerId("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Invite failed", error.message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/users/${id}/resend-invite`, { method: "POST", json: {} }),
    onSuccess: async () => {
      toast.success("Invite resent", "A fresh activation link has been emailed.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Resend failed", error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, lineManagerId }: { id: string; lineManagerId: string | null }) =>
      apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        json: { lineManagerId },
      }),
    onSuccess: async () => {
      toast.success("Line manager updated");
      setEditingLineManagerId(null);
      setLineManagerDraft("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Update failed", error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true; mode: "deleted" | "disabled" }>(`/admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async (data, id) => {
      const removed = usersQuery.data?.items.find((user) => user.id === id);
      toast.success(
        data.mode === "deleted" ? "User removed" : "User disabled",
        data.mode === "deleted"
          ? `${removed?.fullName ?? "User"} was deleted.`
          : `${removed?.fullName ?? "User"} can no longer sign in.`,
      );
      setConfirmRemoveId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Remove failed", error.message);
    },
  });

  return (
    <AdminShell active="users">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">ADMIN</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Users & invitations
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Invite staff, set their line manager, track activation, and remove people who should no
        longer have access.
      </p>
      {usersQuery.isLoading || meQuery.isLoading ? (
        <TwoColumnFormSkeleton />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <Input
              placeholder="Search by name or email"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            {usersQuery.isError ? (
              <StateView className="mt-4" state="error" description="Sign in as admin first." />
            ) : !usersQuery.data?.items.length ? (
              <StateView
                className="mt-4"
                state="empty"
                title="No users yet"
                description="Invite your first staff member to get started."
              />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2">Name</th>
                      <th>Line manager</th>
                      <th>Sign-in</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {usersQuery.data.items.map((user) => {
                      const isSelf = meQuery.data?.id === user.id;
                      const confirming = confirmRemoveId === user.id;
                      return (
                        <tr key={user.id} className="border-t border-border">
                          <td className="py-3">
                            <p className="font-semibold text-navy">{user.fullName}</p>
                            <p className="text-muted">{user.email}</p>
                          </td>
                          <td>
                            {editingLineManagerId === user.id ? (
                              <div className="min-w-[220px] space-y-2">
                                <UserPicker
                                  value={lineManagerDraft}
                                  onChange={setLineManagerDraft}
                                  placeholder="Choose line manager…"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    loading={
                                      updateUserMutation.isPending &&
                                      updateUserMutation.variables?.id === user.id
                                    }
                                    onClick={() =>
                                      updateUserMutation.mutate({
                                        id: user.id,
                                        lineManagerId: lineManagerDraft || null,
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingLineManagerId(null);
                                      setLineManagerDraft("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{user.lineManagerName ?? "—"}</span>
                                {user.status !== "DISABLED" ? (
                                  <Button
                                    variant="link"
                                    className="text-xs"
                                    onClick={() => {
                                      setEditingLineManagerId(user.id);
                                      setLineManagerDraft("");
                                    }}
                                  >
                                    Change
                                  </Button>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td>
                            {user.authMethod === "PASSWORD"
                              ? "Password"
                              : user.authMethod === "OTP"
                                ? "One-time code"
                                : "Not chosen"}
                          </td>
                          <td>
                            <Badge
                              variant={
                                user.status === "ACTIVE"
                                  ? "success"
                                  : user.status === "DISABLED"
                                    ? "muted"
                                    : user.inviteStatus === "EXPIRED"
                                      ? "danger"
                                      : "warning"
                              }
                            >
                              {user.status === "ACTIVE"
                                ? "Active"
                                : user.status === "DISABLED"
                                  ? "Removed"
                                  : user.inviteStatus === "EXPIRED"
                                    ? "Invite expired"
                                    : "Invited"}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-3">
                              {user.status === "INVITED" ? (
                                <Button
                                  variant="link"
                                  onClick={() => resendMutation.mutate(user.id)}
                                  loading={
                                    resendMutation.isPending && resendMutation.variables === user.id
                                  }
                                  loadingText="Sending…"
                                >
                                  Resend
                                </Button>
                              ) : null}
                              {user.status !== "DISABLED" && !isSelf ? (
                                confirming ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      loading={
                                        removeMutation.isPending &&
                                        removeMutation.variables === user.id
                                      }
                                      loadingText="Removing…"
                                      onClick={() => removeMutation.mutate(user.id)}
                                    >
                                      Confirm remove
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setConfirmRemoveId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="link"
                                    className="text-danger"
                                    onClick={() => setConfirmRemoveId(user.id)}
                                  >
                                    Remove
                                  </Button>
                                )
                              ) : isSelf ? (
                                <span className="text-xs text-muted">You</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <CardTitle>Invite a user</CardTitle>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                inviteMutation.mutate();
              }}
            >
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="e.g. Programme Associate"
                />
              </div>
              <div>
                <Label>Line manager</Label>
                <UserPicker
                  value={lineManagerId}
                  onChange={setLineManagerId}
                  placeholder="Search for a line manager…"
                />
              </div>
              <div>
                <Label>Access</Label>
                <div className="mt-1 flex gap-2">
                  {(["STAFF", "ADMIN"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        role === option ? "border-accent bg-accent-soft text-navy" : "border-border"
                      }`}
                      onClick={() => setRole(option)}
                    >
                      {option === "STAFF" ? "Staff" : "Admin"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={remindCreatePlan}
                  onChange={(event) => setRemindCreatePlan(event.target.checked)}
                />
                Remind me to create their Impact Plan
              </label>
              <Button
                type="submit"
                size="full"
                loading={inviteMutation.isPending}
                loadingText="Sending invitation…"
              >
                Send invitation
              </Button>
              <p className="text-xs text-muted">
                They&apos;ll get a secure activation link that expires in 7 days.
              </p>
            </form>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
