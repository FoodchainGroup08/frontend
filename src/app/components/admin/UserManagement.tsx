import { useState, useEffect } from "react";
import { Mail, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getAllUsers, patchUserStatus, type SystemUser } from "@/services/api";

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
    } catch {
      setError("Failed to load users");
      toast.error("Failed to load users");
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
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = filterRole === "All"
    ? users
    : users.filter(u => u.role === filterRole);

  const roles = ["All", "Customer", "Kitchen Staff", "Branch Manager", "Admin"];

  if (isLoading) {
    return (
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
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
      <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="p-6 sm:p-8 text-center">
          <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
          <Button onClick={fetchUsers} variant="outline" className="border-[#3B2314]/20" style={{ color: '#3B2314' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#3B2314', fontWeight: 600 }}>
            User Management
          </h1>
          <p style={{ color: '#3B2314', opacity: 0.7 }}>
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
                backgroundColor: '#F0A500',
                color: '#1E1E1E'
              } : {
                backgroundColor: 'white',
                borderColor: '#3B2314',
                color: '#3B2314',
                opacity: 0.6,
                border: '1px solid'
              }}
            >
              {role}
              {role !== "All" && (
                <Badge
                  className="ml-2 border-0"
                  style={{
                    backgroundColor: filterRole === role ? '#1E1E1E' : '#F0A500',
                    color: filterRole === role ? '#FAF7F2' : '#1E1E1E'
                  }}
                >
                  {users.filter(u => u.role === role).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3B2314' }}>
              {filterRole === "All" ? `All Users (${filteredUsers.length})` : `${filterRole}s (${filteredUsers.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Name</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Email</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Role</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Branch</TableHead>
                    <TableHead style={{ color: '#3B2314', fontWeight: 600 }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: '#3B2314', fontWeight: 600 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell style={{ color: '#3B2314', fontWeight: 600 }}>
                        {user.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: '#3B2314', opacity: 0.4 }} />
                          <span className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-0"
                          style={{
                            backgroundColor:
                              user.role === 'Admin' ? '#3B2314' :
                              user.role === 'Branch Manager' ? '#F0A500' :
                              user.role === 'Kitchen Staff' ? '#4CAF7D' :
                              '#3B2314',
                            color: 'white',
                            opacity: user.role === 'Customer' ? 0.7 : 1
                          }}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#3B2314', opacity: 0.7 }}>
                        {user.branch || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.status === 'active' ? (
                            <CheckCircle className="w-4 h-4" style={{ color: '#4CAF7D' }} />
                          ) : (
                            <XCircle className="w-4 h-4" style={{ color: '#E8622A' }} />
                          )}
                          <span
                            className="text-sm"
                            style={{
                              color: user.status === 'active' ? '#4CAF7D' : '#E8622A',
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
                            borderColor: user.status === 'active' ? '#E8622A' : '#4CAF7D',
                            color: user.status === 'active' ? '#E8622A' : '#4CAF7D'
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
          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
                {users.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#4CAF7D', fontWeight: 600 }}>
                {users.filter(u => u.status === 'active').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#F0A500', fontWeight: 600 }}>
                {users.filter(u => u.role !== 'Customer').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#3B2314]/10" style={{ backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>
                {users.filter(u => u.role === 'Customer').length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
