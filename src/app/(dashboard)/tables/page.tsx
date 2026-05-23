"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Tables = () => {
  const tableData = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "Inactive" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User", status: "Active" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "Admin", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tables</h1>
        <p className="text-muted-foreground">Manage and display your data</p>
      </div>

      <Card className="bg-white shadow-card border-0">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-foreground">User Management</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        user.status === "Active" ? "bg-black text-white" : 
                        user.status === "Pending" ? "bg-zinc-200 text-black" : 
                        "bg-white text-black border border-zinc-200"
                      )}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Tables;