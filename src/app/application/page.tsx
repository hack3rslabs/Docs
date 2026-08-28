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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    panFile: File | null;
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
    panFile: null,
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
    if (isSubmitting || isSuccess) return;
    
    setIsSubmitting(true);
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

      if (res.data.success) {
        setIsSuccess(true);
      } else {
        setMessage("⚠️ Failed to submit: " + (res.data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Submission failed", err);
      setMessage("❌ Error submitting application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 border border-gray-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Submission Successful!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thank you for submitting your information. Your submission has been received successfully.
          </p>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-semibold">
            Our team will review your submission and get back to you shortly.
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-widest pt-4 border-t border-gray-100">
            You may now close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Employee Onboarding Application Form
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <span className="text-sm">Upload PAN</span>
                <input
                  type="file"
                  name="panFile"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="border p-2 rounded w-full"
                />
              </label>


            </div>
          </section>

          {/* Upload Documents */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Resume Upload (PDF Only)</h3>
            <label>
              <span className="text-sm text-red-600 font-bold">* Mandatory Resume (PDF)</span>
              <input
                type="file"
                name="resume"
                accept=".pdf"
                required
                onChange={handleFileChange}
                className="border p-2 rounded w-full mt-2"
              />
            </label>
          </section>
        </div>

        {/* ---------------- RIGHT COLUMN ---------------- */}
        <div className="space-y-10">
          {/* Professional Information */}
          <section className="border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <span className="text-sm">EPF Service History</span>
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

          {/* Terms and Conditions */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-sm text-zinc-600 leading-relaxed font-medium">
                I hereby declare that the information provided in this application is true and correct to the best of my knowledge and belief. I understand that any false or misleading information may result in my disqualification from the hiring process or termination of employment. By submitting this form, I agree to the terms and conditions and authorize the company to verify this information.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !acceptedTerms}
            className="w-full bg-green-600 text-white py-4 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : "Submit Application"}
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
