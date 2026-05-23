"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";

interface Lead {
  name: string;
  email: string;
  phone: string;
}

const ApplicationFormContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [lead, setLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState<{
    fatherName: string;
    dob: string;
    gender: string;
    maritalStatus: string;
    address: string;
    aadhar: string;
    pan: string;
    designation: string;
    department: string;
    joiningDate: string;
    relievingDate: string;
    ctc: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branchName: string;
    uan: string;
    esi: string;
    aadharFile: File | null;
    resume: File | null;
    bankPassbook: File | null;
    pfFile: File | null;
    referenceFile: string;
  }>({
    fatherName: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    address: "",
    aadhar: "",
    pan: "",
    designation: "",
    department: "",
    joiningDate: "",
    relievingDate: "",
    ctc: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branchName: "",
    uan: "",
    esi: "",
    aadharFile: null,
    resume: null,
    bankPassbook: null,
    pfFile: null,
    referenceFile: "",
  });

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await axios.get(
          `${(process.env.NEXT_PUBLIC_API_BASE || "/api")}/leads/by-token/${token}`
        );
        if (res.data.success) setLead(res.data.lead);
        else setMessage("Invalid or expired link.");
      } catch {
        setMessage("Error loading form.");
      }
    };
    if (token) fetchLead();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const form = new FormData();
      form.append("token", token || "");
      form.append("name", lead?.name || "");
      form.append("email", lead?.email || "");
      form.append("phone", lead?.phone || "");

      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          form.append(key, value);
        } else if (value !== null) {
          form.append(key, value as string);
        }
      });

      const res = await axios.post(
        `${(process.env.NEXT_PUBLIC_API_BASE || "/api")}/application`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage(
        res.data.success
          ? "✅ Application submitted successfully!"
          : "⚠️ Failed to submit."
      );

      if (res.data.success) {
        setFormData({
          fatherName: "",
          dob: "",
          gender: "",
          maritalStatus: "",
          address: "",
          aadhar: "",
          pan: "",
          designation: "",
          department: "",
          joiningDate: "",
          relievingDate: "",
          ctc: "",
          bankName: "",
          accountNumber: "",
          ifsc: "",
          branchName: "",
          uan: "",
          esi: "",
          aadharFile: null,
          resume: null,
          bankPassbook: null,
          pfFile: null,
          referenceFile: "",
        });
      }
    } catch {
      setMessage("❌ Error submitting application.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Employee Application Form
      </h2>

      {/* TWO COLUMN GRID  */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-10"
        encType="multipart/form-data"
      >
        {/* ---------------- LEFT COLUMN ---------------- */}
        <div className="space-y-10">

          {/* Applicant Details */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Applicant Details</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm">Full Name</span>
                <input
                  type="text"
                  value={lead?.name || ""}
                  className="w-full border p-2 rounded bg-gray-100"
                  readOnly
                />
              </label>

              <label className="block">
                <span className="text-sm">Email</span>
                <input
                  type="email"
                  value={lead?.email || ""}
                  className="w-full border p-2 rounded bg-gray-100"
                  readOnly
                />
              </label>

              <label className="block">
                <span className="text-sm">Phone Number</span>
                <input
                  type="tel"
                  value={lead?.phone || ""}
                  className="w-full border p-2 rounded bg-gray-100"
                  readOnly
                />
              </label>
            </div>
          </section>

          {/* Personal Information */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm">Father’s Name</span>
                <input
                  name="fatherName"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Date of Birth</span>
                <input
                  type="date"
                  name="dob"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Gender</span>
                <select
                  name="gender"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                <span className="text-sm">Marital Status</span>
                <select
                  name="maritalStatus"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Single</option>
                  <option>Married</option>
                </select>
              </label>

              <label className="col-span-2">
                <span className="text-sm">Address</span>
                <input
                  name="address"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Aadhar Number</span>
                <input
                  name="aadhar"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Upload Aadhar</span>
                <input
                  type="file"
                  name="aadharFile"
                  accept=".pdf,.jpg,.png"
                  onChange={handleFileChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">PAN Number</span>
                <input
                  name="pan"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Upload Resume</span>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="border p-2 rounded w-full"
                />
              </label>
            </div>
          </section>

          {/* Upload Documents */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">PF File</h3>
            <label>
              <span className="text-sm">Upload PF File</span>
              <input
                type="file"
                name="pfFile"
                accept=".pdf"
                onChange={handleFileChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </section>
        </div>

        {/* ---------------- RIGHT COLUMN ---------------- */}
        <div className="space-y-10">
          {/* Professional Information */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm">Designation</span>
                <input
                  name="designation"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Department</span>
                <input
                  name="department"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Joining Date</span>
                <input
                  type="date"
                  name="joiningDate"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Relieving Date</span>
                <input
                  type="date"
                  name="relievingDate"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label className="col-span-2">
                <span className="text-sm">CTC</span>
                <input
                  name="ctc"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>
            </div>
          </section>

          {/* Beneficiary Info */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Beneficiary Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm">Bank Name</span>
                <input
                  name="bankName"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Account Number</span>
                <input
                  name="accountNumber"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">IFSC Code</span>
                <input
                  name="ifsc"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Branch Name</span>
                <input
                  name="branchName"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">UAN</span>
                <input
                  name="uan"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">Upload Passbook</span>
                <input
                  type="file"
                  name="bankPassbook"
                  accept=".pdf,.jpg,.png"
                  onChange={handleFileChange}
                  className="border p-2 rounded w-full"
                />
              </label>

              <label>
                <span className="text-sm">ESI</span>
                <input
                  name="esi"
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </label>
            </div>
          </section>

          {/* Reference */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Reference Details</h3>
            <input
              type="text"
              name="referenceFile"
              onChange={handleChange}
              value={formData.referenceFile}
              className="border p-2 rounded w-full"
              placeholder="Name / Contact"
            />
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
          >
            Submit Application
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
};

const ApplicationForm = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Form...</div>}>
      <ApplicationFormContent />
    </Suspense>
  );
};

export default ApplicationForm;
