"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  applicationToken: string | null;
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
  const { data } = await axios.get<{ success: boolean; leads?: Lead[] }>(
    `${API_BASE}/leads`
  );
  return data.leads || [];
};

const fetchApplications = async (): Promise<Application[]> => {
  const { data } = await axios.get<{ success: boolean; applications: Application[] }>(
    `${API_BASE}/application`
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
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [companies, setCompanies] = useState<{ name: string }[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Store the original employee ID once
  const initialEmpId =
  editingApp?.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

  const [empId, setEmpId] = useState(initialEmpId);
  const [isCustomEmpId, setIsCustomEmpId] = useState(false);
  const [searchName, setSearchName] = useState("");


  const [assignData, setAssignData] = useState({
    companyName: "",
    jobType: "",
    mentorName: "",
    mentorDesignation: "",
    empId: "",
  });

  // ✅ Fetch company list
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings/list`);
        const raw =
          res.data.data ||
          res.data.settings ||
          res.data.result ||
          res.data.list ||
          res.data ||
          [];
        const list = Array.isArray(raw) ? raw : [];
        const companyList = list.map((item: any) => ({
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
  const { data: leads = [], refetch: refetchLeads } = useQuery({
    queryKey: ["students-leads"],
    queryFn: fetchLeads,
  });

  // ✅ Fetch Applications
  const { data: appsData = [], refetch: refetchApps } = useQuery({
    queryKey: ["students-applications"],
    queryFn: fetchApplications,
    enabled: false,
  });

  useEffect(() => {
    if (appsData.length && applications.length === 0) {
      setApplications(appsData);
    }
  }, [appsData, applications]);

  // -------------------- HANDLERS -------------------- //
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setMessage({ text: "", type: "" });
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/leads`, formData);
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
      await axios.post(`${API_BASE}/leads/store-link`, { leadId, applicationLink: link });
    } catch (err) {
      console.error("Failed to store link:", err);
    }
  };

  const handleSaveClick = () => setShowAssignPopup(true);

  const handleUpdateApplication = async () => {
    if (!editingApp) return;
    try {
      const formData = new FormData();
      Object.entries(editingApp).forEach(([key, value]) => {
        if (!["id", "createdAt", "__v"].includes(key) && value != null) {
          if (["string", "number", "boolean"].includes(typeof value)) {
            formData.append(key, value.toString());
          }
        }
      });
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await axios.put(`${API_BASE}/application/${editingApp.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Application updated successfully");
      setEditingApp(null);
      setSelectedFiles({});
      const { data } = await axios.get(`${API_BASE}/application`);
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error("Update failed:", err.response || err);
      alert("❌ Failed to update application");
    }
  };

  const handleAssignSubmit = async () => {
    if (!editingApp) return;
    try {
      const updatedApp = {
        ...editingApp,
        companyName: assignData.companyName,
        jobType: assignData.jobType,
        mentorName: assignData.mentorName,
        mentorDesignation: assignData.mentorDesignation,
        empId:
          assignData.empId ||
          editingApp.empId ||
          `EMP-${Math.floor(Math.random() * 10000)}`,
      };

      const res = await axios.put(`${API_BASE}/application/${editingApp.id}`, updatedApp);
      if (res.data.success) {
        alert("✅ Application assigned successfully!");
        setApplications((prev) =>
          prev.map((app) => (app.id === editingApp.id ? { ...app, ...updatedApp } : app))
        );
        setShowAssignPopup(false);
        setEditingApp(null);
        setAssignData({
          companyName: "",
          jobType: "",
          mentorName: "",
          mentorDesignation: "",
          empId: "",
        });
        await refetchApps();
      } else {
        alert(res.data.message || "⚠️ Failed to assign application.");
      }
    } catch (err) {
      console.error("❌ Error assigning application:", err);
      alert("❌ Failed to update application assignment. Please try again.");
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
                <td className="border px-4 py-2">
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
              <td className="border px-4 py-2">
                <button
                  onClick={() => setEditingApp(app)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Verify
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )}
</div>


      {/* -------------------- POPUPS -------------------- */}
      {editingApp && !showAssignPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-lg flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800">Application Details</h3>
              <button
                onClick={() => setEditingApp(null)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Object.entries(editingApp).map(([key, value]) => {
                  if (["id", "createdAt", "__v", "lead"].includes(key)) return null;

                  const downloadOnlyFields = ["aadharFile", "bankPassbook", "pfFile", "resume"];
                  const isDownloadOnly = downloadOnlyFields.includes(key);

                  if (isDownloadOnly) {
                    return (
                      <div key={key}>
                        <label className="block text-sm font-semibold capitalize text-gray-700 mb-2">
                          {key.replace(/([A-Z])/g, " $1")}
                        </label>
                        {value ? (
                       <a
  href={`${API_BASE}/files/${value.split("/").pop()}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  📄 Download {key.replace(/([A-Z])/g, " $1")}
</a>


                        ) : (
                          <p className="text-gray-400 text-sm">No file uploaded</p>
                        )}
                      </div>
                    );
                  }

                  if (key === "referenceFile") {
                    return (
                      <div key={key}>
                        <label className="block text-sm font-semibold capitalize text-gray-700 mb-2">
                          {key.replace(/([A-Z])/g, " $1")}
                        </label>
                        <input
                          type="text"
                          value={value || ""}
                          readOnly
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-gray-100 text-gray-700"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <label className="block text-sm font-semibold capitalize text-gray-700 mb-2">
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type="text"
                        value={value || ""}
                        onChange={(e) =>
                          setEditingApp((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : prev
                          )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring focus:ring-blue-300 focus:border-blue-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-4 bg-gray-50">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApplication}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Update
              </button>
              <button
                onClick={handleSaveClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Approve
              </button>
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
                  // Reset to ORIGINAL stored ID (not a new random one)
                  setEmpId(initialEmpId);
                  setAssignData({ ...assignData, empId: initialEmpId });
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
          className={`px-3 py-1 rounded text-white ${
            !assignData.companyName ||
            !assignData.jobType ||
            !assignData.mentorName ||
            !assignData.mentorDesignation
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Approve
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Leads;
