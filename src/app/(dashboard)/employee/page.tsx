"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  jobType: string;
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
}

const API = (process.env.NEXT_PUBLIC_API_BASE || "/api");

// Fetch applications
const fetchApplications = async (): Promise<Application[]> => {
  try {
    const { data } = await axios.get(`${API}/application`);
    return data.applications || [];
  } catch {
    return [];
  }
};

const Employee = () => {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  // ======================================================
  // UPDATE GENERAL DOCUMENT DATES
  // ======================================================
  const updateDateMutation = useMutation({
    mutationFn: async ({ id, type, date }: any) => {
      const { data } = await axios.patch(
        `${API}/update-date/${id}`,
        { type, date }
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
      const { data } = await axios.patch(
        `${API}/update-payslip/${id}`,
        { payslipDate, workingDays }
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
  // UPDATE HIKE DATA
  // ======================================================
  const saveHikeMutation = useMutation({
    mutationFn: async ({
      id,
      hikeIssueDate,
      hikeAmount,
    }: {
      id: string;
      hikeIssueDate: string;
      hikeAmount: string;
    }) => {
      const { data } = await axios.patch(
        `${API}/update-hike/${id}`,
        { hikeIssueDate, hikeAmount }
      );
      return data.application;
    },
    onSuccess: (updatedApp: Application) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (selectedApp?.id === updatedApp.id) setSelectedApp(updatedApp);
      alert("Hike details saved!");
    },
  });

  // ======================================================
  // DOWNLOAD DOCUMENT
  // ======================================================
  const handleDownload = async (app: Application, type: string) => {
    try {
      const res = await axios.post(
        `${API}/generate/${type}/${app.id}`,
        {},
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const friendlyName =
        type === "hike-letter"
          ? `${app.name}_Hike_Letter.pdf`
          : `${app.name}_${type}.pdf`;

      a.download = friendlyName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download document.");
    }
  };

  const [searchName, setSearchName] = useState("");


  // ======================================================
  // DOCUMENT LIST
  // ======================================================
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
      type: "noc",
      label: "NOC",
      field: "nocDate",
      color: "bg-red-600 hover:bg-red-700",
    },
  ];

   return (
   <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-white rounded shadow">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold">👥 Enrolled Employees</h2>

    {/* -------------------- SEARCH BAR -------------------- */}
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        placeholder="Search by name..."
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        className="border p-2 pl-10 rounded w-full"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
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
                .filter((app) =>
                  app.name.toLowerCase().includes(searchName.toLowerCase())
                )
                .map((app) => (
                  <tr key={app.id}>
                    <td className="border px-4 py-2">{app.name}</td>
                    <td className="border px-4 py-2">{app.email}</td>
                    <td className="border px-4 py-2">{app.phone}</td>
                    <td className="border px-4 py-2">{app.companyName}</td>
                    <td className="border px-4 py-2">{app.jobType}</td>
                    <td className="border px-4 py-2 text-center">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                        onClick={() => setSelectedApp(app)}
                      >
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
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
        rounded-xl 
        shadow-2xl 
        p-6 
        space-y-4
      "
    >
      <h3 className="text-xl font-semibold text-center mb-4">
        {selectedApp.jobType === "Internship"
          ? "Internship Certificate"
          : "Employee Documents"}
      </h3>

      <div className="flex flex-col gap-4">

        {/* INTERNSHIP */}
        {selectedApp.jobType === "Internship" && (
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            <button
              onClick={() => handleDownload(selectedApp, "certificate")}
              className="px-4 py-2 w-40 text-white rounded bg-purple-600 hover:bg-purple-700"
            >
              Download
            </button>

            <input
              type="date"
              className="border px-3 py-2 rounded w-full md:w-40 text-sm"
              value={selectedApp.internshipDate || ""}
              onChange={(e) =>
                updateDateMutation.mutate({
                  id: selectedApp.id,
                  type: "certificate",
                  date: e.target.value,
                })
              }
            />
          </div>
        )}

        {/* FULL TIME */}
        {selectedApp.jobType !== "Internship" && (
          <>

            {fullTimeDocuments.map((doc) => (
              <div
                key={doc.type}
                className="flex items-center justify-center gap-4"
              >
                <button
                  onClick={() => handleDownload(selectedApp, doc.type)}
                  className={`px-4 py-2 w-40 text-white rounded ${doc.color}`}
                >
                  {doc.label}
                </button>

                <input
                  type="date"
                  className="border px-3 py-2 rounded w-40 text-sm"
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

            {/* PAYSLIP */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
              <button
                onClick={() => handleDownload(selectedApp, "payslip")}
                className="px-4 py-2 w-40 text-white bg-purple-600 hover:bg-purple-700 rounded"
              >
                Payslip
              </button>

              <input
                type="date"
                className="border px-3 py-2 rounded w-full md:w-40 text-sm"
                value={selectedApp.payslipDate || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, payslipDate: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Working Days"
                className="border px-3 py-2 rounded w-full md:w-40 text-sm"
                value={selectedApp.workingDays || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, workingDays: e.target.value })
                }
              />

              <button
                className="px-3 py-2 bg-green-600 text-white rounded w-24"
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

            {/* HIKE */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
              <button
                className="px-4 py-2 w-40 text-white bg-yellow-600 hover:bg-yellow-700 rounded"
                onClick={() => handleDownload(selectedApp, "hike-letter")}
              >
                Hike Letter
              </button>

              <input
                type="date"
                className="border px-3 py-2 rounded w-full md:w-40 text-sm"
                value={selectedApp.hikeIssueDate || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, hikeIssueDate: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Hike Amount"
                className="border px-3 py-2 rounded w-full md:w-40 text-sm"
                value={selectedApp.hikeAmount || ""}
                onChange={(e) =>
                  setSelectedApp({ ...selectedApp, hikeAmount: e.target.value })
                }
              />

              <button
                className="px-3 py-2 bg-green-600 text-white rounded w-24"
                onClick={() =>
                  saveHikeMutation.mutate({
                    id: selectedApp.id,
                    hikeIssueDate: selectedApp.hikeIssueDate || "",
                    hikeAmount: selectedApp.hikeAmount || "0",
                  })
                }
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => setSelectedApp(null)}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Employee;
