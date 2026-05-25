const jwt = require('jsonwebtoken');
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const SECRET = 'local_dev_secret_monolith';

async function runE2E() {
  try {
    console.log('1. Generating Admin Token...');
    const token = jwt.sign({ id: 'cmooo13ee0000vmtc4enp9x9j', email: 'employer@docs.com' }, SECRET, { expiresIn: '1h' });

    const timestamp = Date.now();
    const leadEmail = `e2e_${timestamp}@example.com`;
    const leadPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;

    console.log(`2. Creating Lead (Email: ${leadEmail})...`);
    const createLeadRes = await axios.post(`${API_BASE}/leads`, {
      name: 'E2E Test User',
      email: leadEmail,
      phone: leadPhone,
      paymentAmount: 15000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!createLeadRes.data.success) {
      throw new Error(`Failed to create lead: ${JSON.stringify(createLeadRes.data)}`);
    }

    const applicationLink = createLeadRes.data.link;
    console.log(`Lead Created! Link: ${applicationLink}`);
    
    // Extract token from link
    const url = new URL(applicationLink);
    const appToken = url.searchParams.get('token');

    console.log(`3. Verifying Token API...`);
    const byTokenRes = await axios.get(`${API_BASE}/leads/by-token/${appToken}`);
    if (!byTokenRes.data.success) {
       throw new Error('Failed to fetch lead by token');
    }
    console.log(`Token verified for: ${byTokenRes.data.lead.name}`);

    console.log(`4. Submitting Application...`);
    // Using native fetch with FormData or axios with FormData
    const formData = new FormData();
    formData.append('token', appToken);
    formData.append('name', 'E2E Test User');
    formData.append('email', leadEmail);
    formData.append('phone', leadPhone);
    formData.append('fatherName', 'E2E Father');
    formData.append('dob', '1995-01-01');
    formData.append('gender', 'Male');
    formData.append('maritalStatus', 'Single');
    formData.append('address', '123 E2E Street, Test City');
    formData.append('aadhar', '123412341234');
    formData.append('pan', 'ABCDE1234F');
    formData.append('designation', 'Software Engineer');
    formData.append('department', 'Engineering');
    formData.append('joiningDate', '2026-06-01');
    formData.append('ctc', '600000');

    const appSubmitRes = await fetch(`${API_BASE}/application`, {
      method: 'POST',
      body: formData
    });
    
    const appSubmitData = await appSubmitRes.json();
    if (!appSubmitData.success) {
      throw new Error(`Failed to submit application: ${JSON.stringify(appSubmitData)}`);
    }
    console.log(`Application submitted successfully! Application ID: ${appSubmitData.data.id}`);

    console.log(`5. Verifying Application in Admin List...`);
    const appsRes = await axios.get(`${API_BASE}/application`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const apps = appsRes.data.applications;
    const foundApp = apps.find(a => a.email === leadEmail);
    
    if (foundApp) {
      console.log(`Found unapproved application for ${leadEmail}`);
    } else {
      throw new Error('Application was submitted but not found in the list API');
    }

    console.log(`6. Admin Verifying and Approving Application...`);
    const assignPayload = {
      ...foundApp,
      companyName: "Techwell E2E Corp",
      jobType: "Full-Time",
      mentorName: "Jane Doe",
      mentorDesignation: "Lead Engineer",
      empId: `EMP-E2E-${timestamp}`,
      approved: true
    };

    const approveRes = await axios.put(`${API_BASE}/application/${foundApp.id}`, assignPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!approveRes.data.success) {
      throw new Error(`Failed to approve application: ${JSON.stringify(approveRes.data)}`);
    }

    console.log(`✅ Application Approved! Assigned EMP ID: ${assignPayload.empId}`);
    console.log(`✅ TRUE END TO END TEST PASSED! The lead is now an enrolled employee.`);

  } catch (error) {
    console.error('❌ E2E TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

runE2E();