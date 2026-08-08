/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

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
  webAddress?: string;
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
    webAddress: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [stamp, setStamp] = useState<File | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  

  // Change Password State
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  /* ---------------------------------------------------------
     🔤 CAPITALIZATION FUNCTION
  --------------------------------------------------------- */
  const toTitleCase = (value: string) =>
    value.replace(/\b\w/g, (char) => char.toUpperCase());

  /* ---------------------------------------------------------
     FETCH COMPANIES
  --------------------------------------------------------- */
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/settings/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) await fetchCompanies();
    };
    load();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        webAddress: company.webAddress || "",
      });

      setCompanyLogo(null);
      setStamp(null);
    }
  };

  /* ---------------------------------------------------------
     HANDLE INPUT CHANGE
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

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/settings/save`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(res.data.message);
      fetchCompanies();
    } catch (error) {
      console.error(error);
      alert("❌ Failed to save settings.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert("New passwords do not match!");
    
    try {
      setUpdatingPassword(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API}/settings/password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        alert("Password updated successfully!");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        alert("Error: " + data.message);
      }
    } catch (err: any) {
      alert("Failed to update password. Check your current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  /* ---------------------------------------------------------
     COMPONENT UI
  --------------------------------------------------------- */
  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">System Settings</h1>
        <p className="text-zinc-500 text-sm font-medium">Manage company profiles and administrator security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER: COMPANY SETTINGS */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-lg font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tight">
                🏢 Company Profiles
              </h2>
              
              <div className="w-full sm:w-64">
                <select
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  onChange={handleSelectCompany}
                  value={selectedCompanyId || "__new__"}
                >
                  <option value="__new__">➕ Add New Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Company Name" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="e.g. Techwell Solutions" 
                  readOnly={!!selectedCompanyId} 
                  className={!!selectedCompanyId ? "w-full bg-zinc-200 border border-zinc-300 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-500 cursor-not-allowed" : ""} 
                />
                <Select label="Logo Alignment" name="logoAlignment" value={formData.logoAlignment} onChange={handleChange} options={["left", "center", "right"]} />
                
                <FileInput label="Company Logo" onChange={(e) => handleFileChange(e, "logo")} preview={companyLogo} />
                <FileInput label="Official Stamp" onChange={(e) => handleFileChange(e, "stamp")} preview={stamp} />
                
                <Input label="Authorized Person" name="authorizedPerson" value={formData.authorizedPerson} onChange={handleChange} />
                <Input label="Designation" name="authorizedDesignation" value={formData.authorizedDesignation} onChange={handleChange} />
                
                <div className="md:col-span-2">
                  <Textarea label="Office Address" name="address" value={formData.address} onChange={handleChange} rows={3} />
                </div>

                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                <Input label="Web Address" name="webAddress" value={formData.webAddress} onChange={handleChange} />
                
                <Input label="Purpose (Optional)" name="purpose" value={formData.purpose} onChange={handleChange} />
                <Input label="Place" name="place" value={formData.place} onChange={handleChange} />
              </div>

              <div className="pt-6 border-t border-zinc-100 flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter px-12 py-7 rounded-xl shadow-xl shadow-blue-200 transition-all text-base"
                >
                  {selectedCompanyId ? "Update Profile" : "Create Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: SECURITY SETTINGS */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 h-fit sticky top-24">
            <h2 className="text-lg font-black text-zinc-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              🔐 Security & Admin
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">Current Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
              </div>

              <div className="h-[1px] bg-zinc-100 my-4" />

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">New Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>

              <Button 
                type="submit" 
                disabled={updatingPassword}
                className="w-full bg-zinc-900 hover:bg-black text-white font-black uppercase tracking-tighter py-7 rounded-xl mt-6 transition-all text-sm shadow-xl"
              >
                {updatingPassword ? "🔄 Updating..." : "Change Password"}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-[11px] text-amber-800 leading-relaxed font-bold italic">
                Notice: Changing your password will invalidate your current session. Please log in again after the update.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ---------- INTERNAL COMPONENTS ---------- */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input = ({ label, ...props }: InputProps) => (
  <div>
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">{label}</label>
    <input {...props} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-300" />
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
const Textarea = ({ label, ...props }: TextareaProps) => (
  <div>
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">{label}</label>
    <textarea {...props} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-300" />
  </div>
);

interface FileInputProps {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  preview: File | null;
}
const FileInput = ({ label, onChange, preview }: FileInputProps) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">{label}</label>
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-6 bg-zinc-50 hover:bg-zinc-100 transition-all cursor-pointer relative group">
      <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
      <div className="text-center">
        {preview ? (
          <div className="flex flex-col items-center">
            <img src={URL.createObjectURL(preview)} className="h-16 object-contain rounded-md shadow-sm border border-white" alt="Preview" />
            <p className="text-[9px] mt-2 font-black text-blue-600 uppercase">Ready to upload</p>
          </div>
        ) : (
          <>
            <div className="text-zinc-400 group-hover:text-blue-600 transition-colors mb-1 italic text-xs font-black uppercase">Click to Select</div>
            <p className="text-[10px] text-zinc-400 font-medium">PNG or JPG | Max 2MB</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const Select = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5 block">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer capitalize"
    >
      {options.map((opt: any) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Settings;
