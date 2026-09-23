import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { DashboardIndex } from './pages/dashboard/DashboardIndex';
import { CustomCursor } from './components/CustomCursor';
import { EmployeesIndex } from './pages/employees/EmployeesIndex';
import { EmployeeProfile } from './pages/employees/EmployeeProfile';

// Product
import { AwisIntelligence } from './pages/product/AwisIntelligence';
import { NineDimensions } from './pages/product/NineDimensions';
import { HowItWorks } from './pages/product/HowItWorks';

// Solutions
import { WorkforceAllocation } from './pages/solutions/WorkforceAllocation';
import { TeamFormation } from './pages/solutions/TeamFormation';
import { EmployeeWellbeing } from './pages/solutions/EmployeeWellbeing';
import { ProjectIntelligence } from './pages/solutions/ProjectIntelligence';

// Resources
import { Documentation } from './pages/resources/Documentation';
import { Research } from './pages/resources/Research';
import { Insights } from './pages/resources/Insights';

// Company & Pricing
import { Pricing } from './pages/Pricing';
import { About } from './pages/company/About';
import { Contact } from './pages/company/Contact';

// Legal
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { CookiePolicy } from './pages/legal/CookiePolicy';

function App() {
  return (
    <>
      <Router>
        <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          
          {/* Product Routes */}
          <Route path="product/awis-intelligence" element={<AwisIntelligence />} />
          <Route path="product/9-dimensions" element={<NineDimensions />} />
          <Route path="product/how-it-works" element={<HowItWorks />} />
          
          {/* Solutions Routes */}
          <Route path="solutions/workforce-allocation" element={<WorkforceAllocation />} />
          <Route path="solutions/team-formation" element={<TeamFormation />} />
          <Route path="solutions/employee-wellbeing" element={<EmployeeWellbeing />} />
          <Route path="solutions/project-intelligence" element={<ProjectIntelligence />} />
          
          {/* Resources Routes */}
          <Route path="resources/documentation" element={<Documentation />} />
          <Route path="resources/research" element={<Research />} />
          <Route path="resources/insights" element={<Insights />} />
          
          {/* Pricing, Company, Legal */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="cookie-policy" element={<CookiePolicy />} />
        </Route>

        {/* Authenticated Dashboard Routes */}
        <Route path="/app" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            
            {/* Placeholders for future modules to prevent 404s from sidebar */}
            <Route path="employees">
              <Route index element={<EmployeesIndex />} />
              <Route path=":id" element={<EmployeeProfile />} />
            </Route>
            <Route path="projects" element={<div className="p-10">Projects Module Coming Soon</div>} />
            <Route path="teams" element={<div className="p-10">Team Formation Module Coming Soon</div>} />
            <Route path="analytics" element={<div className="p-10">Analytics Module Coming Soon</div>} />
            <Route path="reports" element={<div className="p-10">Reports Module Coming Soon</div>} />
            <Route path="settings" element={<div className="p-10">Settings Module Coming Soon</div>} />
          </Route>
        </Route>
      </Routes>
    </Router>
    <CustomCursor />
    </>
  );
}

export default App;
