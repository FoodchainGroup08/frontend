import { useState } from "react";
import { Mail, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Kitchen Staff" | "Branch Manager" | "Admin";
  status: "active" | "inactive";
  branch?: string;
}

interface UserManagementProps {
  users?: User[];
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Adebayo Ogunlesi",
    email: "adebayo@foodchain.ng",
    role: "Branch Manager",
    status: "active",
    branch: "Victoria Island"
  },
  {
    id: "2",
    name: "Chioma Nwosu",
    email: "chioma@foodchain.ng",
    role: "Branch Manager",
    status: "active",
    branch: "Lekki Phase 1"
  },
  {
    id: "3",
    name: "Ibrahim Yusuf",
    email: "ibrahim@foodchain.ng",
    role: "Kitchen Staff",
    status: "active",
    branch: "Victoria Island"
  },
  {
    id: "4",
    name: "Funmilayo Ibrahim",
    email: "funmi@foodchain.ng",
    role: "Kitchen Staff",
    status: "active",
    branch: "Lekki Phase 1"
  },
  {
    id: "5",
    name: "Demo User",
    email: "demo@foodchain.ng",
    role: "Customer",
    status: "active"
  },
  {
    id: "6",
    name: "John Doe",
    email: "john@customer.com",
    role: "Customer",
    status: "active"
  },
  {
    id: "7",
    name: "Sarah Wilson",
    email: "sarah@customer.com",
    role: "Customer",
    status: "inactive"
  },
  {
    id: "8",
    name: "Michael Chen",
    email: "michael@foodchain.ng",
    role: "Kitchen Staff",
    status: "active",
    branch: "Ikeja GRA"
  }
];

export function UserManagement({ users: initialUsers = mockUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filterRole, setFilterRole] = useState<string>("All");

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const filteredUsers = filterRole === "All"
    ? users
    : users.filter(u => u.role === filterRole);

  const roles = ["All", "Customer", "Kitchen Staff", "Branch Manager", "Admin"];

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
