export interface SalaryBreakdown {
  monthlyCtc: number;
  basic: number;
  houseRentAllowance: number;
  statutoryBonus: number;
  specialAllowance: number;
  employerPf: number;
  employerEsi: number;
  providentFund: number;
  employeeEsi: number;
  professionalTax: number;
  grossSalary: number;
  totalContribution: number;
  totalDeduction: number;
  netTakeHome: number;
}

export function calculateSalary(annualCtc: number): SalaryBreakdown {
  const monthlyCtc = annualCtc / 12;
  
  // Rule: If Monthly CTC > 21,000, no ESI
  const isEsiApplicable = monthlyCtc <= 21000;
  
  // Basic is 50% of Monthly CTC (Approx)
  // But we need to account for Employer PF/ESI within CTC
  // CTC = Gross + Employer PF + Employer ESI
  // Gross = Basic + HRA + Bonus + SpecialAllowance
  
  const basic = monthlyCtc * 0.5;
  const hra = basic * 0.4;
  const statutoryBonus = basic * 0.0833;
  
  const employerPf = basic * 0.12;
  
  // We need to solve for Special Allowance such that:
  // CTC = Basic + HRA + Bonus + SpecialAllowance + EmployerPF + EmployerESI
  
  let employerEsi = 0;
  if (isEsiApplicable) {
    // This is recursive because ESI is on Gross, and Gross depends on Special Allowance
    // But usually we simplify: Employer ESI = Gross * 3.25%
    // Let's assume Gross = MonthlyCtc - EmployerPF - EmployerESI
    // Simplified for ESI:
    employerEsi = (monthlyCtc / 1.0325) * 0.0325;
  }

  const grossSalary = monthlyCtc - employerPf - employerEsi;
  const specialAllowance = grossSalary - (basic + hra + statutoryBonus);
  
  const employeePf = employerPf; // Standard 12%
  const employeeEsi = isEsiApplicable ? grossSalary * 0.0075 : 0;
  const professionalTax = monthlyCtc > 15000 ? 200 : 0; // Flat 200 for > 15k
  
  const totalDeduction = employeePf + employeeEsi + professionalTax;
  const netTakeHome = grossSalary - totalDeduction;

  return {
    monthlyCtc,
    basic: Math.round(basic),
    houseRentAllowance: Math.round(hra),
    statutoryBonus: Math.round(statutoryBonus),
    specialAllowance: Math.round(specialAllowance),
    employerPf: Math.round(employerPf),
    employerEsi: Math.round(employerEsi),
    providentFund: Math.round(employeePf), // Match schema field name
    employeeEsi: Math.round(employeeEsi),
    professionalTax,
    grossSalary: Math.round(grossSalary),
    totalContribution: Math.round(employerPf + employerEsi),
    totalDeduction: Math.round(totalDeduction),
    netTakeHome: Math.round(netTakeHome),
  };
}
