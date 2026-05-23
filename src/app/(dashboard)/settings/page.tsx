"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface Company {
  id: string;
  companyName: string;
  logoAlignment?: string;
  address?: string;
  authorizedPerson?: string;
  authorizedDesignation?: string;
  purpose?: string;
  place?: string;
  phone?: string;
  email?: string;
}

const Settings = () => {
  const API = (process.env.NEXT_PUBLIC_API_BASE || "/api");

  const emptyForm = {
    companyName: "",
    logoAlignment: "left",
    address: "",
    authorizedPerson: "",
    authorizedDesignation: "",
    purpose: "",
    place: "",
    phone: "",
    email: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [stamp, setStamp] = useState<File | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------
     🔤 CAPITALIZATION FUNCTION
  --------------------------------------------------------- */
  const toTitleCase = (value: string) =>
    value.replace(/\b\w/g, (char) => char.toUpperCase());

  /* ---------------------------------------------------------
     FETCH COMPANIES
  --------------------------------------------------------- */
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API}/settings/list`);
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     SELECT COMPANY
  --------------------------------------------------------- */
  const handleSelectCompany = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    if (id === "__new__") {
      setSelectedCompanyId(null);
      setFormData(emptyForm);
      setCompanyLogo(null);
      setStamp(null);
      return;
    }

    const company = companies.find((c) => c.id === id);

    if (company) {
      setSelectedCompanyId(company.id);

      setFormData({
        companyName: company.companyName,
        logoAlignment: company.logoAlignment || "left",
        address: company.address || "",
        authorizedPerson: company.authorizedPerson || "",
        authorizedDesignation: company.authorizedDesignation || "",
        purpose: company.purpose || "",
        place: company.place || "",
        phone: company.phone || "",
        email: company.email || "",
      });

      setCompanyLogo(null);
      setStamp(null);
    }
  };

  /* ---------------------------------------------------------
     HANDLE INPUT CHANGE (UPDATED)
  --------------------------------------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const updatedValue =
      name === "authorizedPerson" || name === "authorizedDesignation"
        ? toTitleCase(value)
        : value;

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));
  };

  /* ---------------------------------------------------------
     FILE UPLOAD HANDLER
  --------------------------------------------------------- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp') => {
    const file = e.target.files?.[0] || null;
    if (type === "logo") setCompanyLogo(file);
    if (type === "stamp") setStamp(file);
  };

  /* ---------------------------------------------------------
     SUBMIT FORM
  --------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value)
      );

      if (companyLogo) data.append("companyLogo", companyLogo);
      if (stamp) data.append("stamp", stamp);

      if (selectedCompanyId) {
        data.append("_id", selectedCompanyId);
      }

      const res = await axios.post(`${API}/settings/save`, data);

      alert(res.data.message);
      fetchCompanies();
    } catch (error) {
      console.error(error);
      alert("❌ Failed to save settings.");
    }
  };

  /* ---------------------------------------------------------
     COMPONENT UI
  --------------------------------------------------------- */
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Company Settings
      </h1>

      {/* Select Company */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">
          Select Company
        </label>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={handleSelectCompany}
            value={selectedCompanyId || "__new__"}
          >
            <option value="__new__">➕ Add New Company</option>

            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Column 1 */}
        <div className="space-y-5">
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />

          <FileInput
            label="Company Logo (700*132)"
            onChange={(e) => handleFileChange(e, "logo")}
            preview={companyLogo}
          />

          <Select
            label="Logo Alignment"
            name="logoAlignment"
            value={formData.logoAlignment}
            onChange={handleChange}
            options={["left", "center", "right"]}
          />

          <FileInput
            label="Stamp (353*353)"
            onChange={(e) => handleFileChange(e, "stamp")}
            preview={stamp}
          />
        </div>

        {/* Column 2 */}
        <div className="space-y-5">
          <Input
            label="Authorized Person"
            name="authorizedPerson"
            value={formData.authorizedPerson}
            onChange={handleChange}
          />

          <Input
            label="Authorized Designation"
            name="authorizedDesignation"
            value={formData.authorizedDesignation}
            onChange={handleChange}
          />

          <Textarea
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        {/* Column 3 */}
        <div className="space-y-5">
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
          />

          <Input
            label="Place"
            name="place"
            value={formData.place}
            onChange={handleChange}
          />
        </div>

        <div className="md:col-span-3 flex justify-center mt-4">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
          >
            Save / Update
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------- COMPONENTS ---------- */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input = ({ label, ...props }: InputProps) => (
  <div>
    <label className="block text-gray-700 mb-1 font-medium">{label}</label>
    <input {...props} className="w-full border rounded-lg px-3 py-2" />
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
const Textarea = ({ label, ...props }: TextareaProps) => (
  <div>
    <label className="block text-gray-700 mb-1 font-medium">{label}</label>
    <textarea {...props} className="w-full border rounded-lg px-3 py-2" />
  </div>
);

interface FileInputProps {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  preview: File | null;
}
const FileInput = ({ label, onChange, preview }: FileInputProps) => (
  <div>
    <label className="block text-gray-700 mb-1 font-medium">{label}</label>
    <input type="file" accept="image/*" onChange={onChange} />
    {preview && (
      <img
        src={URL.createObjectURL(preview)}
        className="h-20 mt-3 border rounded"
        alt="Preview"
      />
    )}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}
const Select = ({ label, name, value, onChange, options }: SelectProps) => (
  <div>
    <label className="block text-gray-700 mb-1 font-medium">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-lg px-3 py-2"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default Settings;
