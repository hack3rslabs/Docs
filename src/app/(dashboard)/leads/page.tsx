"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { calculateSalary } from "@/lib/salary-utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  applicationToken: string | null;
  paymentAmount: number;
  paymentStatus: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  companyName?: string;
  jobType?: string;
  mentorName?: string;
  mentorDesignation?: string;
  aadharFile?: string;
  resume?: string;
  bankPassbook?: string;
  pfFile?: string;
  referenceFile?: string;
  empId?: string;
  [key: string]: any;
}

// ✅ Base API URL from .env
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "/api");

// -------------------- FETCH FUNCTIONS -------------------- //
const fetchLeads = async (): Promise<Lead[]> => {
  const token = localStorage.getItem("token");
  const { data } = await axios.get<{ success: boolean; leads?: Lead[] }>(
    `${API_BASE}/leads`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.leads || [];
};

const fetchApplications = async (): Promise<Application[]> => {
  const token = localStorage.getItem("token");
  const { data } = await axios.get<{ success: boolean; applications: Application[] }>(
    `${API_BASE}/application`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.applications || [];
};

// -------------------- COMPONENT START -------------------- //
const Leads: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);
  const [Verify, setVerify] = useState<"leads" | "applications">("leads");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewingDocsApp, setViewingDocsApp] = useState<Application | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [companies, setCompanies] = useState<{ name: string }[]>([]);
  const [assignData, setAssignData] = useState({
    companyName: "",
    jobType: "",
    mentorName: "",
    mentorDesignation: "",
    designation: "",
    department: "",
    empId: "",
  });

  const [empId, setEmpId] = useState("");
  const [isCustomEmpId, setIsCustomEmpId] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'bank' | 'dates' | 'salary'>('personal');

  // ✅ Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(`${API_BASE}/leads/${id}`, { paymentStatus: status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      refetchLeads();
    }
  });

  // Update empId helper
  const updateEmpIdForApp = (app: Application | null) => {
    if (app) {
      const targetId = app.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      setEmpId(targetId);
    } else {
      setEmpId("");
    }
    setIsCustomEmpId(false);
  };

  const handleEditApp = (app: Application | null) => {
    if (app && editingApp && app.ctc !== editingApp.ctc) {
      const ctcNum = parseFloat((app.ctc || "0").toString().replace(/,/g, ""));
      if (!isNaN(ctcNum) && ctcNum > 0) {
        const bd = calculateSalary(ctcNum);
        app = {
          ...app,
          basic: bd.basic,
          houseRentAllowance: bd.houseRentAllowance,
          statutoryBonus: bd.statutoryBonus,
          specialAllowance: bd.specialAllowance,
          employerPf: bd.employerPf,
          employerEsi: bd.employerEsi,
          providentFund: bd.providentFund,
          employeeEsi: bd.employeeEsi,
          professionalTax: bd.professionalTax,
          tds: bd.tds,
          grossSalary: bd.grossSalary,
          totalContribution: bd.totalContribution,
          totalDeduction: bd.totalDeduction,
          netTakeHome: bd.netTakeHome,
        };
      }
    }
    setEditingApp(app);
    updateEmpIdForApp(app);
  };


  // ✅ Fetch company list
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/settings/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const raw =
          res.data.data ||
          res.data.settings ||
          res.data.result ||
          res.data.list ||
          res.data ||
          [];
        const list = Array.isArray(raw) ? raw : [];
        const companyList = list.map((item: { name?: string; companyName?: string; title?: string }) => ({
          name: item.name || item.companyName || item.title || "Unnamed Company",
        }));
        setCompanies(companyList);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // ✅ Fetch Leads
  const { data: leadsData = [], refetch: refetchLeads } = useQuery({
    queryKey: ["students-leads"],
    queryFn: fetchLeads,
  });

  // ✅ Fetch Applications
  const { data: appsData = [], refetch: refetchApps } = useQuery({
    queryKey: ["students-applications"],
    queryFn: fetchApplications,
    enabled: false,
  });

  // Local overrides for payment amounts to avoid set-state-in-effect
  const [localPaymentAmounts, setLocalPaymentAmounts] = useState<Record<string, number | null>>({});

  const leads = leadsData.map(l => ({
    ...l,
    paymentAmount: localPaymentAmounts[l.id] !== undefined ? localPaymentAmounts[l.id] : l.paymentAmount
  }));

  const applications = appsData;

  // -------------------- HANDLERS -------------------- //
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setMessage({ text: "", type: "" });
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/leads`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessage({ text: "✅ Lead saved successfully!", type: "success" });
        setFormData({ name: "", email: "", phone: "" });
        refetchLeads();
      } else {
        setMessage({
          text: res.data.message || "⚠️ Failed to save lead.",
          type: "error",
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "❌ Error saving lead.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: string, leadId: string) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
    setCopiedId(leadId);
    setTimeout(() => setCopiedId(null), 2000);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/leads/store-link`, { leadId, applicationLink: link }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to store link:", err);
    }
  };

  const handleSaveClick = () => setShowAssignPopup(true);

  const handleUpdateApplication = async () => {
    if (!editingApp) return;
    try {
      console.log("Starting handleUpdateApplication for ID:", editingApp.id);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Object.entries(editingApp).forEach(([key, value]) => {
        if (!["id", "createdAt", "__v", "lead"].includes(key) && value != null) {
          if (["string", "number", "boolean"].includes(typeof value)) {
            formData.append(key, value.toString());
          }
        }
      });
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) {
          console.log(`Appending file ${key}:`, file.name);
          formData.append(key, file);
        }
      });

      // Let axios set the boundary for multipart/form-data automatically
      const res = await axios.put(`${API_BASE}/application/${editingApp.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Update response:", res.data);

      if (res.data.success) {
        alert("✅ Application updated successfully");
        handleEditApp(null);
        setSelectedFiles({});
        await refetchApps();
      } else {
        alert(`⚠️ Failed to update: ${res.data.message || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Update failed detailed:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack
      });
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`❌ Failed to update application: ${errorMsg}`);
    }
  };

  const handleAssignSubmit = async () => {
    if (!editingApp) return;
    try {
      console.log("Starting handleAssignSubmit for ID:", editingApp.id);
      const token = localStorage.getItem("token");
      const updatedApp = {
        ...editingApp,
        companyName: assignData.companyName,
        jobType: assignData.jobType,
        mentorName: assignData.mentorName,
        mentorDesignation: assignData.mentorDesignation,
        designation: assignData.designation || editingApp.designation,
        department: assignData.department || editingApp.department,
        empId: empId,
        approved: true, // Mark as approved
      };

      console.log("Sending assign data:", updatedApp);
      const res = await axios.put(`${API_BASE}/application/${editingApp.id}`, updatedApp, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Assign response:", res.data);

      if (res.data.success) {
        alert("✅ Application assigned successfully!");
        setShowAssignPopup(false);
        handleEditApp(null);
        setAssignData({
          companyName: "",
          jobType: "",
          mentorName: "",
          mentorDesignation: "",
          designation: "",
          department: "",
          empId: "",
        });
        await refetchApps();
      } else {
        alert(res.data.message || "⚠️ Failed to assign application.");
      }
    } catch (err: any) {
      console.error("❌ Error assigning application:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`❌ Failed to update application assignment: ${errorMsg}`);
    }
  };

  // -------------------- JSX RETURN -------------------- //
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">📋 Manage Leads & Applications</h2>

      {/* -------------------- LEAD FORM -------------------- */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="border p-2 rounded flex-1 min-w-[150px]"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="border p-2 rounded flex-1 min-w-[150px]"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </div>

      {message.text && (
        <p
          className={`mb-4 text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

     {/* -------------------- TOGGLE BUTTONS + SEARCH -------------------- */}
<div className="flex flex-wrap items-center justify-between mb-4 gap-2">
  {/* Toggle Buttons */}
  <div className="flex gap-4">
    <button
      onClick={() => setVerify("leads")}
      className={`px-4 py-2 rounded ${
        Verify === "leads" ? "bg-gray-800 text-white" : "bg-gray-200"
      }`}
    >
      Sent Links
    </button>
    <button
      onClick={() => {
        setVerify("applications");
        refetchApps();
      }}
      className={`px-4 py-2 rounded ${
        Verify === "applications" ? "bg-blue-800 text-white" : "bg-gray-200"
      }`}
    >
      Applications
    </button>
  </div>

  {/* Search Bar */}
  <div className="relative w-full max-w-xs">
    <input
      type="text"
      placeholder="Search by name..."
      value={searchName}
      onChange={(e) => setSearchName(e.target.value)}
      className="border p-2 pl-10 rounded w-full"
    />
    {/* Search Icon */}
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      🔍
    </span>
  </div>
</div>



{/* -------------------- TABLE SECTION -------------------- */}
<div className="overflow-x-auto">
  {Verify === "leads" ? (
    <table className="table-auto w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-4 py-2">Name</th>
          <th className="border px-4 py-2">Email</th>
          <th className="border px-4 py-2">Phone</th>
          <th className="border px-4 py-2">Registration (15k)</th>
          <th className="border px-4 py-2">Copy Link</th>
        </tr>
      </thead>
      <tbody>
        {leads
          .filter((lead) =>
            lead.name.toLowerCase().includes(searchName.toLowerCase())
          )
          .map((lead) => {
            const baseUrl =
              process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            const link = `${baseUrl}/application?token=${lead.applicationToken}`;

            return (
              <tr key={lead.id}>
                <td className="border px-4 py-2">{lead.name}</td>
                <td className="border px-4 py-2">{lead.email}</td>
                <td className="border px-4 py-2">{lead.phone}</td>
                <td className="border px-4 py-2 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    <select
                      value={lead.paymentStatus}
                      onChange={(e) => updatePaymentMutation.mutate({ id: lead.id, status: e.target.value })}
                      className={`w-28 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg border shadow-sm cursor-pointer transition-all ${
                        lead.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 
                        lead.paymentStatus === 'Waived' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Waived">Waived</option>
                    </select>
                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200 shadow-inner">
                      <span className="text-[10px] text-zinc-400 font-black italic">INR</span>
                      <input 
                        type="number"
                        placeholder="15000"
                        className="w-20 text-[11px] font-black text-zinc-700 bg-transparent border-none p-0 text-center focus:ring-0"
                        value={lead.paymentAmount === null ? "" : lead.paymentAmount}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 15000;
                          axios.patch(`${API_BASE}/leads/${lead.id}`, { paymentAmount: val }, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                          }).then(() => refetchLeads());
                        }}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          setLocalPaymentAmounts(prev => ({ ...prev, [lead.id]: val }));
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="border px-4 py-2 text-center">
                  {lead.applicationToken ? (
                    <button
                      onClick={() => copyToClipboard(link, lead.id)}
                      className={`px-3 py-1 rounded text-white ${
                        copiedId === lead.id ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {copiedId === lead.id ? "Copied!" : "Copy"}
                    </button>
                  ) : (
                    <span className="text-gray-400">Used</span>
                  )}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  ) : (
    <table className="table-auto w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-4 py-2">Name</th>
          <th className="border px-4 py-2">Email</th>
          <th className="border px-4 py-2">Phone</th>
          <th className="border px-4 py-2">Created</th>
          <th className="border px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {applications
          .filter((app) =>
            app.name.toLowerCase().includes(searchName.toLowerCase())
          )
          .map((app) => (
            <tr key={app.id}>
              <td className="border px-4 py-2">{app.name}</td>
              <td className="border px-4 py-2">{app.email}</td>
              <td className="border px-4 py-2">{app.phone}</td>
              <td className="border px-4 py-2">
                {new Date(app.createdAt).toLocaleDateString()}
              </td>
              <td className="border px-4 py-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  {app.approved ? (
                    <button
                      onClick={() => handleEditApp(app)}
                      className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-black uppercase flex items-center gap-1"
                    >
                      <span>✅</span> Verified
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditApp(app)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-all"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => setViewingDocsApp(app)}
                    className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-black text-xs font-bold transition-all"
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )}
</div>


      {/* -------------------- POPUPS -------------------- */}
      {editingApp && !showAssignPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b p-6 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm">📋</span>
                  Application Verification
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Verify and update applicant information before approval</p>
              </div>
              <button
                onClick={() => handleEditApp(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Area - Display all fields in a single scrollable grid */}
            <div className="p-8 flex-1 overflow-y-auto bg-white custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {Object.entries(editingApp).map(([key, value]) => {
                  if (["id", "createdAt", "updatedAt", "__v", "lead", "leadId", "approved"].includes(key)) return null;

                  // Filter out salary fields to show them in a special table below
                  const salaryFields = ['basic', 'houseRentAllowance', 'statutoryBonus', 'specialAllowance', 'monthlyCtc', 'employerEsi', 'employerPf', 'employeeEsi', 'providentFund', 'professionalTax', 'tds', 'grossSalary', 'totalContribution', 'totalDeduction', 'netTakeHome', 'annualCtc'];
                  if (salaryFields.includes(key)) return null;

                  const downloadOnlyFields = ["aadharFile", "panFile", "bankPassbook", "pfFile", "resume"];
                  const isDownloadOnly = downloadOnlyFields.includes(key);

                  if (isDownloadOnly) {
                    return (
                      <div key={key} className="space-y-2 group">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors">
                          {key.replace(/([A-Z])/g, " $1")}
                        </label>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 group-hover:border-blue-300 transition-all">
                          <span className="text-sm font-bold text-gray-600 truncate max-w-[200px]">
                            {value ? (value as string).split("-").slice(1).join("-") : "No file uploaded"}
                          </span>
                          {value && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const res = await axios.get(`${API_BASE}/files/${(value as string).split("/").pop()}`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(new Blob([res.data], { type: res.data.type || res.headers['content-type'] }));
                                    window.open(url, '_blank');
                                  } catch (err) {
                                    alert("Failed to view file.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black hover:bg-green-600 hover:text-white transition-all shadow-sm"
                              >
                                VIEW
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const res = await axios.get(`${API_BASE}/files/${(value as string).split("/").pop()}`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', (value as string).split("/").pop() || 'file');
                                    document.body.appendChild(link);
                                    link.click();
                                    link.parentNode?.removeChild(link);
                                  } catch (err) {
                                    alert("Failed to download file.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                DOWNLOAD
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const readOnlyFields = ["referenceFile", "basic", "houseRentAllowance", "statutoryBonus", "specialAllowance", "monthlyCtc", "employerEsi", "employerPf", "employeeEsi", "providentFund", "professionalTax", "tds", "grossSalary", "totalContribution", "totalDeduction", "netTakeHome", "annualCtc"];
                  const isReadOnly = readOnlyFields.includes(key);

                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400">
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type="text"
                        value={value || ""}
                        readOnly={isReadOnly}
                        onChange={(e) =>
                          handleEditApp(
                            editingApp ? { ...editingApp, [key]: e.target.value } : editingApp
                          )
                        }
                        className={`w-full px-4 py-3 rounded-xl border font-bold text-sm transition-all shadow-sm focus:ring-4 focus:ring-blue-100 ${
                          isReadOnly 
                            ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" 
                            : "bg-white border-gray-300 text-gray-800 focus:border-blue-500 hover:border-gray-400"
                        }`}
                        placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* GROSS EARNINGS TABLE SECTION */}
              <div className="mt-12 border-t pt-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-blue-600 rounded-full" />
                  Financial Breakdown (Monthly)
                </h4>
                
                <div className="gross-earnings-table">
                  <div className="grid grid-cols-2 bg-gray-900">
                    <div className="gross-earnings-header">Component</div>
                    <div className="gross-earnings-header text-right">Amount (INR)</div>
                  </div>
                  
                  {[
                    { label: 'Basic Salary', key: 'basic' },
                    { label: 'HRA', key: 'houseRentAllowance' },
                    { label: 'Statutory Bonus', key: 'statutoryBonus' },
                    { label: 'Special Allowance', key: 'specialAllowance' },
                    { label: 'TOTAL GROSS SALARY', key: 'grossSalary', isTotal: true },
                    { label: 'Net Take Home', key: 'netTakeHome', isTotal: true, isBlue: true }
                  ].map((item, idx) => (
                    <div 
                      key={item.key} 
                      className={`grid grid-cols-2 ${idx % 2 === 1 ? 'gross-earnings-row-alt' : 'gross-earnings-row'} ${item.isTotal ? 'bg-zinc-100 border-t-2 border-zinc-200' : ''}`}
                    >
                      <div className={`gross-earnings-cell ${item.isTotal ? 'font-black' : ''}`}>
                        {item.label}
                      </div>
                      <div className={`gross-earnings-cell text-right ${item.isTotal ? 'font-black' : ''} ${item.isBlue ? 'text-blue-600 font-black' : ''}`}>
                        {Math.round(Number((editingApp as any)[item.key] || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] text-gray-400 mt-4 italic font-medium">
                  * Values are automatically calculated based on Annual CTC.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center border-t p-6 bg-gray-50/50 gap-3">
              <button
                onClick={() => handleEditApp(null)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApplication}
                className="px-8 py-2.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95"
              >
                UPDATE RECORD
              </button>
              {!editingApp.approved && (
                <button
                  onClick={handleSaveClick}
                  className="px-8 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <span>⚡</span> APPROVE & ENROLL
                </button>
              )}
            </div>
          </div>
        </div>
      )}


    {/* Popup for Assigning */}
{showAssignPopup && editingApp && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white w-[90%] max-w-md rounded shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Assign Company, Job & Mentor</h3>

      <div className="space-y-4">

        {/* EMPLOYEE ID with Checkbox */}
    <div>
       <label className="block mb-1 font-medium text-gray-700">Employee ID</label>

        <input
          type="text"
          value={empId}
          onChange={(e) => {
            if (isCustomEmpId) {
              setEmpId(e.target.value);
              setAssignData({ ...assignData, empId: e.target.value });
            }
          }}
          readOnly={!isCustomEmpId}
          className={`border p-2 w-full rounded ${
            !isCustomEmpId ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />

          {/* Checkbox to enable custom ID */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCustomEmpId}
              onChange={(e) => {
                setIsCustomEmpId(e.target.checked);

                if (!e.target.checked) {
                  // Reset to ORIGINAL stored ID or a new random one
                  const originalId = editingApp?.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
                  setEmpId(originalId);
                  setAssignData({ ...assignData, empId: originalId });
                }
              }}
            />

            <label className="text-sm text-gray-700">
              Enable manual Employee ID entry
            </label>
          </div>
        </div>


        {/* Company Name */}
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <select
            value={assignData.companyName}
            onChange={(e) =>
              setAssignData({ ...assignData, companyName: e.target.value })
            }
            className="border p-2 w-full rounded"
          >
            <option value="">-- Select Company --</option>
            {companies.length > 0 ? (
              companies.map((c, i) => (
                <option key={i} value={c.name}>
                  {c.name}
                </option>
              ))
            ) : (
              <option disabled>No companies available</option>
            )}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block mb-1 font-medium">Job Type</label>
          <select
            value={assignData.jobType}
            onChange={(e) =>
              setAssignData({ ...assignData, jobType: e.target.value })
            }
            className="border p-2 w-full rounded"
          >
            <option value="">-- Select Job Type --</option>
            <option value="Internship">Internship</option>
            <option value="Full Time">Full Time</option>
          </select>
        </div>

        {/* Mentor Name */}
        <div>
          <label className="block mb-1 font-medium">Mentor Name</label>
          <input
            type="text"
            value={assignData.mentorName}
            onChange={(e) =>
              setAssignData({ ...assignData, mentorName: e.target.value })
            }
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Mentor Designation */}
        <div>
          <label className="block mb-1 font-medium">Mentor Designation</label>
          <input
            type="text"
            value={assignData.mentorDesignation}
            onChange={(e) =>
              setAssignData({ ...assignData, mentorDesignation: e.target.value })
            }
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Candidate Designation */}
        <div>
          <label className="block mb-1 font-medium">Candidate Designation</label>
          <input
            type="text"
            value={assignData.designation}
            onChange={(e) =>
              setAssignData({ ...assignData, designation: e.target.value })
            }
            placeholder={editingApp?.designation || "e.g., Software Engineer"}
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Candidate Department */}
        <div>
          <label className="block mb-1 font-medium">Department</label>
          <input
            type="text"
            value={assignData.department}
            onChange={(e) =>
              setAssignData({ ...assignData, department: e.target.value })
            }
            placeholder={editingApp?.department || "e.g., Engineering"}
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Reporting Manager Name</label>
          <input
            type="text"
            value={assignData.mentorName}
            onChange={(e) =>
              setAssignData({ ...assignData, mentorName: e.target.value })
            }
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Mentor Designation */}
        <div>
          <label className="block mb-1 font-medium">Reporting Manager Designation</label>
          <input
            type="text"
            value={assignData.mentorDesignation}
            onChange={(e) =>
              setAssignData({ ...assignData, mentorDesignation: e.target.value })
            }
            className="border p-2 w-full rounded"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => setShowAssignPopup(false)}
          className="px-3 py-1 bg-gray-400 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleAssignSubmit}
          disabled={
            !assignData.companyName ||
            !assignData.jobType ||
            !assignData.mentorName ||
            !assignData.mentorDesignation
          }
          className={`px-6 py-2 rounded text-white font-bold transition-all shadow-md ${
            !assignData.companyName ||
            !assignData.jobType ||
            !assignData.mentorName ||
            !assignData.mentorDesignation
              ? "bg-gray-400 cursor-not-allowed"
              : editingApp.approved 
                ? "bg-zinc-800 hover:bg-black" 
                : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {editingApp.approved ? "Update Record" : "Approve & Enroll"}
        </button>
      </div>
    </div>
  </div>
)}
{/* View Documents Popup */}
{viewingDocsApp && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase">Candidate Uploads</h3>
          <p className="text-blue-200 text-sm font-bold mt-1">{viewingDocsApp.name}</p>
        </div>
        <button onClick={() => setViewingDocsApp(null)} className="text-blue-200 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-50">
        {[
          { key: "resume", label: "Resume" },
          { key: "aadharFile", label: "Aadhar" },
          { key: "panFile", label: "PAN" },
          { key: "bankPassbook", label: "EPF Service History / Bank" },
          { key: "pfFile", label: "PF File" },
          { key: "referenceFile", label: "Reference" },
        ].map((doc) => {
          const val = (viewingDocsApp as any)[doc.key];
          if (!val) return null;
          return (
            <div key={doc.key} className="flex flex-col items-center p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 text-center">{doc.label}</span>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get(`${API_BASE}/files/${val.split("/").pop()}`, {
                      headers: { Authorization: `Bearer ${token}` },
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: res.data.type || res.headers['content-type'] }));
                    window.open(url, '_blank');
                  } catch (err) {
                    alert("Failed to view file.");
                  }
                }}
                className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-black text-[10px] uppercase rounded-lg transition-all"
              >
                View File
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Leads;
