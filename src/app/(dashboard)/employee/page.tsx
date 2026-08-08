"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Application {
  id: string;
  empId?: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  jobType: string;
  pan?: string;
  uan?: string;
  mentorName?: string;
  mentorDesignation?: string;
  joiningDate?: string;
  relievingDate?: string;
  department?: string;

  // Dates
  offerDate?: string;
  appointmentDate?: string;
  experienceDate?: string;
  internshipDate?: string;
  nocDate?: string;

  // Payslip
  payslipDate?: string;
  workingDays?: string;

  // Hike
  hikeIssueDate?: string;
  hikeAmount?: string;
  hikeDate?: string;

  hikeLetters?: any[];
  auditLogs?: any[];
}

const API = (process.env.NEXT_PUBLIC_API_BASE || "/api");

// Fetch applications
const fetchApplications = async (): Promise<Application[]> => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(`${API}/application`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.applications || [];
  } catch {
    return [];
  }
};

const Employee = () => {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [importJson, setImportJson] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [manualCtc, setManualCtc] = useState<string>("");
  const [editingEmployee, setEditingEmployee] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  // ======================================================
  // DELETE EMPLOYEE
  // ======================================================
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/application/${id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      alert("Employee record deleted successfully.");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this record? This will re-enable the lead for re-submission.")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  // ======================================================
  // UPDATE APPLICATION (FOR EDIT)
  // ======================================================
  const updateAppMutation = useMutation({
    mutationFn: async (updatedApp: any) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(`${API}/application/${updatedApp.id}`, updatedApp, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.application;
    },
    onSuccess: (updatedApp: Application) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (selectedApp?.id === updatedApp.id) setSelectedApp(updatedApp);
      alert("Employee record updated!");
    },
  });

  // ======================================================
  // BULK IMPORT
  // ======================================================
  const handleImport = async () => {
    try {
      setIsImporting(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      if (importFile) {
        formData.append('file', importFile);
      } else if (importJson.trim()) {
        formData.append('employees', JSON.stringify(JSON.parse(importJson)));
      } else {
        alert("Please select a file or paste JSON data.");
        return;
      }
      
      const { data } = await axios.post(`${API}/application/import`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (data.success) {
        alert(data.message);
        queryClient.invalidateQueries({ queryKey: ["applications"] });
        setImportJson("");
        setImportFile(null);
        setIsDialogOpen(false);
      } else {
        alert("Import failed: " + data.message);
      }
    } catch (err: any) {
      alert("Error importing data. Please check the format.");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/application/import`, { 
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      alert("Failed to download template.");
    }
  };

  // ======================================================
  // UPDATE GENERAL DOCUMENT DATES
  // ======================================================
  const updateDateMutation = useMutation({
    mutationFn: async ({ id, type, date }: any) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        `${API}/update-date/${id}`,
        { type, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.application;
    },
    onSuccess: (updatedApp: Application) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (selectedApp?.id === updatedApp.id) setSelectedApp(updatedApp);
      alert("Saved!");
    },
  });

  // ======================================================
  // UPDATE PAYSLIP DATA
  // ======================================================
  const savePayslipMutation = useMutation({
    mutationFn: async ({
      id,
      payslipDate,
      workingDays,
    }: {
      id: string;
      payslipDate: string;
      workingDays: string;
    }) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        `${API}/update-payslip/${id}`,
        { payslipDate, workingDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.application;
    },
    onSuccess: (updatedApp: Application) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (selectedApp?.id === updatedApp.id) setSelectedApp(updatedApp);
      alert("Payslip details saved!");
    },
  });

  // ======================================================
  // CREATE HIKE DATA
  // ======================================================
  const [newHike, setNewHike] = useState({ hikeAmount: "", hikeIssueDate: "", hikeDate: "" });

  const saveHikeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/hikes`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.hikeLetter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      alert("Hike letter created successfully! Please refresh or re-open the employee to see it in history.");
      setNewHike({ hikeAmount: "", hikeIssueDate: "", hikeDate: "" });
    },
  });

  // ======================================================
  // DOWNLOAD / PREVIEW DOCUMENT
  // ======================================================
  const handleDownload = async (app: Application, type: string, isPreview = false) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/generate/${type}/${app.id}`,
        { manualCtc: (type === 'payslip' || type === 'hike-letter') ? manualCtc : undefined },
        { 
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (isPreview) {
        window.open(url, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = url;
        const friendlyName = type === "hike-letter" ? `${app.name}_Hike_Letter.pdf` : `${app.name}_${type}.pdf`;
        a.download = friendlyName;
        a.click();
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      console.error("Document processing error:", err);
      const errorMsg = "Failed to process document.";
      if (err.response?.data instanceof Blob) {
        // Try to read the error message from the blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string);
            alert(`Error: ${data.message || errorMsg}`);
          } catch {
            alert(errorMsg);
          }
        };
        reader.readAsText(err.response.data);
      } else {
        alert(err.response?.data?.message || errorMsg);
      }
    }
  };

  // ======================================================
  // DOCUMENT LIST
  // ======================================================
  const internshipDocuments = [
    {
      type: "internship-offer",
      label: "Intern Offer",
      field: "offerDate",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      type: "certificate",
      label: "Intern Certificate",
      field: "internshipDate",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      type: "noc",
      label: "Intern NOC",
      field: "nocDate",
      color: "bg-red-600 hover:bg-red-700",
    },
  ];

  const fullTimeDocuments = [
    {
      type: "offer-letter",
      label: "Offer letter",
      field: "offerDate",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      type: "appointment-letter",
      label: "Appointment letter",
      field: "appointmentDate",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      type: "experience-letter",
      label: "Experience Letter",
      field: "experienceDate",
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      type: "service-letter",
      label: "Service Letter",
      field: "experienceDate",
      color: "bg-cyan-600 hover:bg-cyan-700",
    },
    {
      type: "relieving-letter",
      label: "Relieving Letter",
      field: "relievingDate",
      color: "bg-rose-600 hover:bg-rose-700",
    },
    {
      type: "noc",
      label: "NOC",
      field: "nocDate",
      color: "bg-red-600 hover:bg-red-700",
    },
  ];

   return (
   <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded shadow">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
    <h2 className="text-xl font-bold">👥 Enrolled Employees</h2>

    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
      {/* -------------------- IMPORT DATA -------------------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-blue-700 hover:bg-blue-800 text-white shadow-md font-bold px-5">
            📥 Import Employees
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
          <div className="bg-blue-700 p-8 text-white">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Import Wizard</h3>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-70">Bulk Employee Onboarding</p>
          </div>

          <div className="p-8 space-y-8 bg-white">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-100 -translate-y-1/2 z-0" />
              {[1, 2, 3].map((step) => (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    (step === 1 && !importFile && !importJson) || (step === 2 && (importFile || importJson)) || (step === 3 && isImporting)
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" 
                      : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Step 1: Template */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Step 1: Preparation</p>
                </div>
                <div className="group bg-zinc-50 hover:bg-white p-4 rounded-xl border border-zinc-200 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between shadow-sm" onClick={downloadTemplate}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-800">Download Template</p>
                      <p className="text-[10px] text-zinc-500 font-bold">Standard Excel Format</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-blue-600"><span className="text-xl">↓</span></Button>
                </div>
              </div>

              {/* Step 2: Source Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Step 2: Source Data</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* File Upload Area */}
                  <div className="relative group">
                    <input
                      type="file"
                      id="excel-upload-wizard"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="excel-upload-wizard"
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                        importFile ? "bg-green-50 border-green-300" : "bg-zinc-50 border-zinc-200 hover:border-blue-400"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl ${importFile ? "bg-green-100" : "bg-zinc-100"}`}>
                        {importFile ? "✅" : "📁"}
                      </div>
                      <p className={`text-sm font-black ${importFile ? "text-green-700" : "text-zinc-800"}`}>
                        {importFile ? importFile.name : "Choose Excel File"}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">or drag and drop here</p>
                    </label>
                  </div>

                  {/* JSON Option Divider */}
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-zinc-100" />
                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">OR</span>
                    <div className="h-[1px] flex-1 bg-zinc-100" />
                  </div>

                  <details className="group">
                    <summary className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors list-none text-center">
                      Advanced: Use JSON Payload
                    </summary>
                    <div className="mt-4">
                      <Textarea
                        placeholder='[{"name": "...", "email": "..."}]'
                        className="min-h-[100px] font-mono text-[9px] bg-zinc-50 border-zinc-200 rounded-xl focus:ring-blue-500"
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        disabled={!!importFile}
                      />
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <Button variant="ghost" className="font-bold text-zinc-500 hover:bg-white" onClick={() => { setIsDialogOpen(false); setImportFile(null); }} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || (!importJson.trim() && !importFile)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-black uppercase tracking-tighter px-8 py-6 rounded-xl shadow-xl shadow-blue-200 transition-all"
            >
              {isImporting ? "🔄 Processing..." : "Execute Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------- SEARCH BAR -------------------- */}
      <div className="relative flex-1 sm:flex-none sm:w-64">
        <input
          type="text"
          placeholder="Search by Name, Phone, Email, PAN, UAN..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="border p-2 pl-10 rounded w-full text-sm"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>
    </div>
  </div>

      {!isLoading && applications.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Company</th>
                <th className="border px-4 py-2">Job Type</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {applications
                .filter((app) => {
                  const s = searchName.toLowerCase();
                  return (
                    (app.name && app.name.toLowerCase().includes(s)) ||
                    (app.email && app.email.toLowerCase().includes(s)) ||
                    (app.phone && app.phone.toLowerCase().includes(s)) ||
                    (app.pan && app.pan.toLowerCase().includes(s)) ||
                    (app.uan && app.uan.toLowerCase().includes(s))
                  );
                })
                .map((app) => (
                  <tr key={app.id}>
                    <td className="border px-4 py-2">{app.name}</td>
                    <td className="border px-4 py-2">{app.email}</td>
                    <td className="border px-4 py-2">{app.phone}</td>
                    <td className="border px-4 py-2">{app.companyName}</td>
                    <td className="border px-4 py-2">{app.jobType}</td>
                    <td className="border px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all"
                          onClick={() => setSelectedApp(app)}
                        >
                          Actions
                        </button>
                        <button
                          className="px-3 py-1 bg-zinc-800 text-white rounded text-xs font-bold hover:bg-black transition-all"
                          onClick={() => setEditingEmployee(app)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-all"
                          onClick={() => handleDelete(app.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* -------------------- EDIT MODAL -------------------- */}
      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
            <div className="bg-zinc-900 p-8 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Record</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Updating {editingEmployee.name}</p>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              {[
                { label: 'Full Name', field: 'name' },
                { label: 'Email Address', field: 'email' },
                { label: 'Mobile Number', field: 'phone' },
                { label: 'Designation', field: 'designation' },
                { label: 'Department', field: 'department' },
                { label: 'Annual CTC', field: 'ctc' },
                { label: 'Employee ID', field: 'empId' },
                { label: 'Bank Name', field: 'bankName' },
                { label: 'Account Number', field: 'accountNumber' },
                { label: 'IFSC Code', field: 'ifsc' },
                { label: 'UAN Number', field: 'uan' },
                { label: 'ESI Number', field: 'esi' },
              ].map(item => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{item.label}</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    value={(editingEmployee as any)[item.field] || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, [item.field]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button variant="ghost" className="font-bold text-zinc-500" onClick={() => setEditingEmployee(null)}>Cancel</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter px-8 py-6 rounded-xl shadow-xl shadow-blue-200 transition-all"
                onClick={() => {
                  updateAppMutation.mutate(editingEmployee);
                  setEditingEmployee(null);
                }}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

{selectedApp && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

    <div
      className="
        bg-white 
        w-full 
        max-w-2xl
        max-h-[85vh]
        overflow-y-auto
        rounded-2xl 
        shadow-2xl 
        p-0
        overflow-hidden
      "
    >
      <div className="bg-blue-700 p-8 text-white relative">
        <button 
          onClick={() => setSelectedApp(null)}
          className="absolute top-4 right-4 text-blue-200 hover:text-white bg-blue-800 hover:bg-blue-900 rounded-full p-1.5 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          {selectedApp.jobType === "Internship" ? "Internship Dossier" : "Employee Documents"}
        </h3>
        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-70 mt-1">{selectedApp.name} | {selectedApp.empId}</p>
      </div>

      <div className="p-8 space-y-6">

        {/* INTERNSHIP */}
        {selectedApp.jobType === "Internship" && (
          <div className="space-y-4">
            {internshipDocuments.map((doc) => (
              <div key={doc.type} className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm">
                <div className="flex flex-col">
                   <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">{doc.label}</p>
                   <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(selectedApp, doc.type)}
                      className={`px-4 py-2 w-28 text-white rounded-lg font-black uppercase text-[10px] shadow-sm ${doc.color}`}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDownload(selectedApp, doc.type, true)}
                      className="px-4 py-2 w-16 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-black uppercase text-[10px] hover:bg-zinc-100 shadow-sm transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
                
                <input
                  type="date"
                  className="border border-zinc-200 bg-white px-3 py-2 rounded-lg w-40 text-sm font-mono font-bold text-zinc-600"
                  value={(selectedApp as any)[doc.field] || ""}
                  onChange={(e) =>
                    updateDateMutation.mutate({
                      id: selectedApp.id,
                      type: doc.type,
                      date: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* FULL TIME */}
        {selectedApp.jobType !== "Internship" && (
          <>
            <div className="grid grid-cols-1 gap-3">
              {fullTimeDocuments.map((doc) => (
                <div
                  key={doc.type}
                  className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100 shadow-sm transition-all hover:bg-white hover:border-blue-100 group"
                >
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5">{doc.label}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(selectedApp, doc.type)}
                        className={`px-4 py-2 w-28 text-white rounded-lg font-black uppercase text-[10px] shadow-sm ${doc.color}`}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDownload(selectedApp, doc.type, true)}
                        className="px-4 py-2 w-16 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-black uppercase text-[10px] hover:bg-zinc-100 shadow-sm transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    className="border border-zinc-200 bg-white px-3 py-2 rounded-lg w-40 text-sm font-mono font-bold text-zinc-600 group-hover:border-blue-200"
                    value={(selectedApp as any)[doc.field] || ""}
                    onChange={(e) =>
                      updateDateMutation.mutate({
                        id: selectedApp.id,
                        type: doc.type,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            {/* PAYSLIP */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm">
              <div className="flex flex-col">
                 <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 text-center md:text-left">Monthly Payslip</p>
                 <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedApp, "payslip")}
                    className="px-4 py-2 w-28 text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-black uppercase text-[10px] shadow-sm"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDownload(selectedApp, "payslip", true)}
                    className="px-4 py-2 w-16 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-black uppercase text-[10px] hover:bg-zinc-100 shadow-sm transition-all"
                  >
                    View
                  </button>
                </div>
              </div>

              <input
                type="date"
                className="border border-zinc-200 bg-white px-3 py-2 rounded-lg w-40 text-sm font-mono font-bold text-zinc-600"
                value={selectedApp.payslipDate || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, payslipDate: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Days"
                className="border border-zinc-200 bg-white px-3 py-2 rounded-lg w-16 text-sm font-black text-center text-blue-600"
                value={selectedApp.workingDays || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, workingDays: e.target.value })
                }
              />

              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-black uppercase text-[10px] w-20 shadow-md hover:bg-green-700 transition-all"
                onClick={() =>
                  savePayslipMutation.mutate({
                    id: selectedApp.id,
                    payslipDate: selectedApp.payslipDate || "",
                    workingDays: selectedApp.workingDays || "0",
                  })
                }
              >
                Save
              </button>
            </div>

            {/* HIKE LETTERS HISTORY & CREATION */}
            <div className="flex flex-col gap-4 border-t pt-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center md:text-left">Hike Letters History</p>
              
              {/* History List */}
              {selectedApp.hikeLetters && selectedApp.hikeLetters.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {selectedApp.hikeLetters.map((hike: any) => (
                    <div key={hike.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-zinc-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-700">₹{hike.hikeAmount.toLocaleString()} Hike (Eff: {hike.hikeDate})</span>
                        <span className="text-[10px] text-zinc-500">Issued: {hike.hikeIssueDate} | Old CTC: ₹{hike.previousCtc?.toLocaleString()} → New CTC: ₹{hike.newCtc?.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.open(`/api/generate/hike-letter/${hike.id}`, "_blank")} className="px-3 py-1 bg-white border border-zinc-200 text-zinc-600 rounded text-[10px] font-bold hover:bg-zinc-50 shadow-sm">View</button>
                        <button onClick={() => window.open(`/api/generate/hike-letter/${hike.id}?download=true`, "_blank")} className="px-3 py-1 bg-yellow-600 text-white rounded text-[10px] font-bold hover:bg-yellow-700 shadow-sm">Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic text-center">No hike history available.</p>
              )}

              {/* Create New Hike Form */}
              <div className="mt-2 pt-4 border-t border-zinc-200 flex flex-col gap-3">
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest text-center md:text-left">Issue New Hike</p>
                <div className="flex flex-wrap gap-3 items-end justify-between">
                  <div className="flex gap-3">
                    <input type="number" placeholder="Amt (₹)" className="border border-zinc-200 bg-white px-3 py-2 rounded-lg w-24 text-sm font-black text-blue-600" value={newHike.hikeAmount} onChange={(e) => setNewHike({ ...newHike, hikeAmount: e.target.value })} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Issue Date</span>
                      <input type="date" className="border border-zinc-200 bg-white px-2 py-2 rounded-lg text-sm font-mono font-bold text-zinc-600 w-32" value={newHike.hikeIssueDate} onChange={(e) => setNewHike({ ...newHike, hikeIssueDate: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Eff. Date</span>
                      <input type="date" className="border border-zinc-200 bg-white px-2 py-2 rounded-lg text-sm font-mono font-bold text-zinc-600 w-32" value={newHike.hikeDate} onChange={(e) => setNewHike({ ...newHike, hikeDate: e.target.value })} />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] shadow-md hover:bg-blue-700 transition-all" onClick={() => saveHikeMutation.mutate({ applicationId: selectedApp.id, ...newHike })}>Issue Hike</button>
                </div>
              </div>
            </div>

            {/* AUDIT LOGS */}
            <div className="flex flex-col gap-4 mt-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center md:text-left">Edit History (Audit Logs)</p>
              {selectedApp.auditLogs && selectedApp.auditLogs.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-zinc-100 text-zinc-500 uppercase font-black text-[9px] sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Field</th>
                        <th className="px-3 py-2">Old Value</th>
                        <th className="px-3 py-2">New Value</th>
                        <th className="px-3 py-2">Modified By</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedApp.auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-3 py-2 font-bold text-zinc-700">{log.field}</td>
                          <td className="px-3 py-2 text-red-500 line-through truncate max-w-[100px]" title={log.oldValue}>{String(log.oldValue || '—')}</td>
                          <td className="px-3 py-2 text-green-600 font-bold truncate max-w-[100px]" title={log.newValue}>{String(log.newValue || '—')}</td>
                          <td className="px-3 py-2 text-zinc-500">{log.modifiedBy}</td>
                          <td className="px-3 py-2 text-zinc-400 font-mono text-[9px] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic text-center">No edits recorded yet.</p>
              )}
            </div>

            {/* MANUAL CTC OVERRIDE */}
            <div className="bg-zinc-900 p-6 rounded-2xl border-none shadow-2xl ring-1 ring-white/5 mt-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-4 block text-center">
                ⚡ Manual Override Mode
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm group-focus-within:text-blue-500 transition-colors">₹</span>
                  <input
                    type="text"
                    placeholder="Enter Custom Annual CTC..."
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white px-10 py-3.5 rounded-xl text-xs font-black tracking-wider focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-zinc-600 shadow-inner"
                    value={manualCtc}
                    onChange={(e) => setManualCtc(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setManualCtc("")}
                  className="px-5 py-2 text-[10px] font-black text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20 uppercase tracking-widest"
                >
                  Reset
                </button>
              </div>
              <p className="text-[8px] text-zinc-600 mt-4 font-black italic uppercase tracking-[0.2em] text-center">
                Real-time calculation will override database values for generated PDFs.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="p-6 bg-zinc-50 border-t border-zinc-100 text-center">
        <button
          onClick={() => setSelectedApp(null)}
          className="px-10 py-3 bg-zinc-800 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
        >
          Close Dossier
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Employee;
