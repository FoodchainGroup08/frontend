import { useState, useEffect } from "react";
import { Mail, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getAllUsers, patchUserStatus, type SystemUser } from "@/services/api";
import { isNetworkError, DEMO_SYSTEM_USERS } from "@/utils/demoData";

export function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState<string>("All");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      if (isNetworkError(err)) {
        setUsers(DEMO_SYSTEM_USERS);
      } else {
        setError("Failed to load users");
        toast.error("Failed to load users");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await patchUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      if (isNetworkError(err)) {
        // Demo mode — update locally
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } else {
        toast.error("Failed to update user status");
      }
    }
  };

  const filteredUsers = filterRole === "All"
    ? users
    : users.filter(u => u.role === filterRole);

  const roles = ["All", "Customer", "Kitchen Staff", "Branch Manager", "Admin"];

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72 mb-8" />
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-9 w-24 rounded-md" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-lg mb-8" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
          <Button onClick={fetchUsers} variant="outline" className="border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            User Management
          </h1>
          <p style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
            Manage all system users and their access levels
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {roles.map((role) => (
            <Button
              key={role}
              onClick={() => setFilterRole(role)}
              size="sm"
              className="transition-all"
              style={filterRole === role ? {
                backgroundColor: 'var(--foodchain-golden-amber)',
                color: 'var(--foodchain-charcoal)'
              } : {
                backgroundColor: 'var(--foodchain-white)',
                borderColor: 'var(--foodchain-espresso)',
                color: 'var(--foodchain-espresso)',
                opacity: 0.6,
                border: '1px solid'
              }}
            >
              {role}
              {role !== "All" && (
                <Badge
                  className="ml-2 border-0"
                  style={{
                    backgroundColor: filterRole === role ? 'var(--foodchain-charcoal)' : 'var(--foodchain-golden-amber)',
                    color: filterRole === role ? 'var(--foodchain-warm-white)' : 'var(--foodchain-charcoal)'
                  }}
                >
                  {users.filter(u => u.role === role).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foodchain-espresso)' }}>
              {filterRole === "All" ? `All Users (${filteredUsers.length})` : `${filterRole}s (${filteredUsers.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Name</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Email</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Role</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Branch</TableHead>
                    <TableHead style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                        {user.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)', opacity: 0.4 }} />
                          <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-0"
                          style={{
                            backgroundColor:
                              user.role === 'Admin' ? 'var(--foodchain-espresso)' :
                              user.role === 'Branch Manager' ? 'var(--foodchain-golden-amber)' :
                              user.role === 'Kitchen Staff' ? 'var(--foodchain-sage-green)' :
                              'var(--foodchain-espresso)',
                            color: 'var(--foodchain-white)',
                            opacity: user.role === 'Customer' ? 0.7 : 1
                          }}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                        {user.branch || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.status === 'active' ? (
                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--foodchain-sage-green)' }} />
                          ) : (
                            <XCircle className="w-4 h-4" style={{ color: 'var(--foodchain-burnt-orange)' }} />
                          )}
                          <span
                            className="text-sm"
                            style={{
                              color: user.status === 'active' ? 'var(--foodchain-sage-green)' : 'var(--foodchain-burnt-orange)',
                              fontWeight: 600
                            }}
                          >
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleToggleStatus(user.id)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          style={{
                            borderColor: user.status === 'active' ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-sage-green)',
                            color: user.status === 'active' ? 'var(--foodchain-burnt-orange)' : 'var(--foodchain-sage-green)'
                          }}
                        >
                          {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-4">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {users.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: 'var(--foodchain-sage-green)', fontWeight: 600 }}>
                {users.filter(u => u.status === 'active').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                {users.filter(u => u.role !== 'Customer').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                {users.filter(u => u.role === 'Customer').length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}