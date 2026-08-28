export interface SalaryBreakdown {
  monthlyCtc: number;
  basic: number;
  houseRentAllowance: number;
  statutoryBonus: number;
  specialAllowance: number;
  employerPf: number;
  employerEsi: number;
  providentFund: number; // Employee PF
  employeeEsi: number;
  professionalTax: number;
  tds: number;
  grossSalary: number;
  totalContribution: number;
  totalDeduction: number;
  netTakeHome: number;
  annualCtc: number;
}

export function calculateSalary(annualCtc: number, optInEpf: boolean = true): SalaryBreakdown {
  const monthlyCtc = Math.round(annualCtc / 12);
  
  // 1. Basic Salary: Mandated at 50% of CTC under New Wage Code
  const basic = Math.round(monthlyCtc * 0.5);
  
  // 2. HRA: 40% of Basic (Non-Metro standard, safe default)
  const hra = Math.round(basic * 0.4);
  
  // 3. Statutory Bonus: 8.33% of Basic (or 8.33% of 7000, whichever is higher, but 8.33% of basic is common)
  const statutoryBonus = Math.round(basic * 0.0833);

  // 4. Employer Contributions (Part of CTC)
  // EPF: 12% of Basic, capped at 15000 wage ceiling if opted in
  const epfWage = optInEpf ? Math.min(basic, 15000) : 0;
  const employerPf = optInEpf ? Math.round(epfWage * 0.12) : 0;
  
  // ESI: 3.25% of Gross, only if Gross <= 21000
  // Gross = MonthlyCtc - EmployerPF - EmployerESI
  // Let's check ESI applicability
  let employerEsi = 0;
  const estimatedGross = monthlyCtc - employerPf;
  if (estimatedGross <= 21000) {
    employerEsi = Math.round((monthlyCtc / 1.0325) * 0.0325);
  }

  const grossSalary = monthlyCtc - employerPf - employerEsi;
  
  // 5. Special Allowance (Balancing Component)
  const specialAllowance = Math.max(0, grossSalary - (basic + hra + statutoryBonus));

  // 6. Employee Deductions
  const employeePf = employerPf; // Match employer 12%
  const employeeEsi = (grossSalary <= 21000) ? Math.round(grossSalary * 0.0075) : 0;
  const professionalTax = (monthlyCtc > 15000) ? 200 : 0;

  // 7. TDS Calculation (New Regime 2024-25)
  // Standard Deduction: 75,000 annually
  const taxableAnnualIncome = Math.max(0, annualCtc - 75000);
  let annualTds = 0;

  if (taxableAnnualIncome > 700000) { // Rebate u/s 87A up to 7L taxable
    if (taxableAnnualIncome <= 300000) {
      annualTds = 0;
    } else if (taxableAnnualIncome <= 700000) {
      annualTds = (taxableAnnualIncome - 300000) * 0.05;
    } else if (taxableAnnualIncome <= 1000000) {
      annualTds = (400000 * 0.05) + (taxableAnnualIncome - 700000) * 0.10;
    } else if (taxableAnnualIncome <= 1200000) {
      annualTds = (400000 * 0.05) + (300000 * 0.10) + (taxableAnnualIncome - 1000000) * 0.15;
    } else if (taxableAnnualIncome <= 1500000) {
      annualTds = (400000 * 0.05) + (300000 * 0.10) + (200000 * 0.15) + (taxableAnnualIncome - 1200000) * 0.20;
    } else {
      annualTds = (400000 * 0.05) + (300000 * 0.10) + (200000 * 0.15) + (300000 * 0.20) + (taxableAnnualIncome - 1500000) * 0.30;
    }
    // Add 4% Health & Education Cess
    annualTds = Math.round(annualTds * 1.04);
  }
  
  const tds = Math.round(annualTds / 12);

  const totalDeduction = employeePf + employeeEsi + professionalTax + tds;
  const netTakeHome = grossSalary - totalDeduction;

  return {
    monthlyCtc,
    basic,
    houseRentAllowance: hra,
    statutoryBonus,
    specialAllowance,
    employerPf,
    employerEsi,
    providentFund: employeePf,
    employeeEsi,
    professionalTax,
    tds,
    grossSalary,
    totalContribution: employerPf + employerEsi,
    totalDeduction,
    netTakeHome,
    annualCtc
  };
}
