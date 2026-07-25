const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replacements = [
  // File names
  { regex: /HospitalCoverageTable/g, replacement: 'HealthCenterCoverageTable' },
  { regex: /HospitalFilterSelect/g, replacement: 'HealthCenterFilterSelect' },
  { regex: /HospitalFormDialog/g, replacement: 'HealthCenterFormDialog' },
  { regex: /HospitalTableActions/g, replacement: 'HealthCenterTableActions' },
  { regex: /ImportHospitalsDialog/g, replacement: 'ImportHealthCentersDialog' },
  { regex: /hospitals\.service/g, replacement: 'healthCenters.service' },
  { regex: /\/hospitals\//g, replacement: '/healthCenters/' },
  
  // Variables & Types
  { regex: /\bhospitalsService\b/g, replacement: 'healthCentersService' },
  { regex: /\bHospitalService\b/g, replacement: 'HealthCenterService' },
  { regex: /\bhospitalId\b/g, replacement: 'healthCenterId' },
  { regex: /\bhospitalIds\b/g, replacement: 'healthCenterIds' },
  { regex: /\bIHospital\b/g, replacement: 'IHealthCenter' },
  { regex: /\bhospital\b/g, replacement: 'healthCenter' },
  { regex: /\bHospital\b/g, replacement: 'HealthCenter' },
  { regex: /\bhospitals\b/g, replacement: 'healthCenters' },
  { regex: /\bHospitals\b/g, replacement: 'HealthCenters' },
  
  // React Query Keys
  { regex: /"all-hospitals"/g, replacement: '"all-health-centers"' },
  { regex: /"all-hospitals-no-pagination"/g, replacement: '"all-health-centers-no-pagination"' },
  { regex: /'all-hospitals'/g, replacement: "'all-health-centers'" },
  { regex: /'all-hospitals-no-pagination'/g, replacement: "'all-health-centers-no-pagination'" },
  
  // API URLs
  { regex: /'\/hospitals/g, replacement: "'/health-centers" },
  { regex: /"\/hospitals/g, replacement: '"/health-centers' },
  
  // UI Strings (Replacing the squashed pascal casing with spaced words for UI text)
  { regex: />HealthCenter</g, replacement: '>Health Center<' },
  { regex: />HealthCenters</g, replacement: '>Health Centers<' },
  { regex: /> HealthCenters/g, replacement: '> Health Centers' },
  { regex: /> HealthCenter/g, replacement: '> Health Center' },
  { regex: />All HealthCenters/g, replacement: '>All Health Centers' },
  { regex: /> All HealthCenters/g, replacement: '> All Health Centers' },
  { regex: /"HealthCenter"/g, replacement: '"Health Center"' },
  { regex: /"HealthCenters"/g, replacement: '"Health Centers"' },
  { regex: /'HealthCenter'/g, replacement: "'Health Center'" },
  { regex: /'HealthCenters'/g, replacement: "'Health Centers'" }
];

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
