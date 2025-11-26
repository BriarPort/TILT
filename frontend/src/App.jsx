import React, { useState, useEffect } from 'react';
import UnlockScreen from './components/UnlockScreen';
import Sidebar from './components/Sidebar';
import RiskMatrix from './components/RiskMatrix';
import VendorCard from './components/VendorCard';
import Dashboard from './components/Dashboard';
import AddVendorForm from './components/AddVendorForm';
import ViewVendor from './components/ViewVendor';
import QuestionEditor from './components/QuestionEditor';
import CloudScorecardForm from './components/CloudScorecardForm';
import CloudMatrixEditor from './components/CloudMatrixEditor';
import OSINTPage from './components/OSINTPage';
import SettingsPage from './components/SettingsPage';
import { Search } from 'lucide-react';
import { calculateVulnerability, calculateCloudVulnerability } from './utils/riskCalculator';
import * as api from './api';

// Main app component that handles the entire application state and routing
// This is the root component that manages which screen to show and coordinates all the data
export default function App() {
  // Track if the database is unlocked (user entered password)
  const [isUnlocked, setIsUnlocked] = useState(false);
  // Track if this is the first time setup (need to create password)
  const [isFirstTime, setIsFirstTime] = useState(false);
  // Current active tab/page in the sidebar navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  // Selected vendor for viewing/editing
  const [selectedVendor, setSelectedVendor] = useState(null);
  // View mode: 'view' or 'edit'
  const [vendorViewMode, setVendorViewMode] = useState('view');
  // Organisation name from settings (Australian English)
  const [orgName, setOrgName] = useState('Your Organisation');
  // List of all vendors loaded from the database
  const [vendors, setVendors] = useState([]);
  // List of assessment questions for standard assessments
  const [questions, setQuestions] = useState([]);
  // List of criteria for cloud scorecard assessments
  const [cloudCriteria, setCloudCriteria] = useState([]);
  // Loading state while checking database status
  const [loading, setLoading] = useState(true);

  // Check if database is locked when the app first loads
  useEffect(() => {
    checkLockStatus();
  }, []);

  // Check whether the database is locked and needs a password
  const checkLockStatus = async () => {
    try {
      const result = await api.isDatabaseLocked();
      if (!result.is_locked) {
        // Database is already unlocked, load all the data
        setIsUnlocked(true);
        loadData();
      } else {
        // Database is locked, show unlock screen
        // If it's first time (needs_password = true), show password creation UI
        // Otherwise, show unlock UI for existing password
        setIsFirstTime(result.needs_password === true);
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
      // If there's an error (e.g., backend not running), assume first time setup
      // This ensures user can still set up the app
      setIsFirstTime(true);
    } finally {
      setLoading(false);
    }
  };

  // Called when user successfully unlocks the database
  const handleUnlock = async () => {
    setIsUnlocked(true);
    await loadData();
  };

  // Load all data from the encrypted database
  // This fetches vendors, questions, cloud criteria, and settings
  const loadData = async () => {
    try {
      // Get organisation name from settings
      const settings = await api.getSettings();
      if (settings.orgName) {
        setOrgName(settings.orgName);
      }

      // Get all vendors from the database
      const vendorsData = await api.getVendors();
      setVendors(vendorsData);

      // Get all assessment questions
      const questionsData = await api.getQuestions();
      setQuestions(questionsData);

      // Get cloud scorecard criteria
      const cloudData = await api.getCloudCriteria();
      setCloudCriteria(cloudData);
    } catch (error) {
      console.error('Error loading data:', error);
      // If database is locked, don't show error - just let user unlock
      if (error.message && error.message.includes('locked')) {
        setIsUnlocked(false);
        return;
      }
      // For other errors, show alert
      alert('Failed to load data: ' + error.message);
    }
  };

  // Save a new vendor or update an existing one
  // This calculates risk scores based on the assessment answers
  const handleSaveVendor = async (vendorData) => {
    try {
      // Start with default values if no assessment data
      let vulnerability = 100;
      let impact = 3;
      let likelihood = 3;

      // Extract OSINT results if available
      // OSINT data might be in osintResults field or parsed from warnings
      let osintResults = null;
      if (vendorData.osintResults) {
        osintResults = vendorData.osintResults;
      } else if (vendorData.osint_warnings && Array.isArray(vendorData.osint_warnings)) {
        // Parse OSINT results from warnings (hacky but works)
        const ransomwareWarning = vendorData.osint_warnings.find(w => w.type === 'ransomware');
        const sslWarning = vendorData.osint_warnings.find(w => w.type === 'ssl');
        const dmarcWarning = vendorData.osint_warnings.find(w => w.type === 'dmarc');
        
        osintResults = {
          ransomware: ransomwareWarning ? true : null,
          ssl: sslWarning ? (sslWarning.message.includes('expired') ? 'F' : 'C') : null,
          dmarc: dmarcWarning ? false : null
        };
      }

      // Impact is set by data classification level (1-5)
      // If data_classification is provided, use it directly for impact
      const hasDataClassification = vendorData.data_classification !== undefined && vendorData.data_classification !== null;
      if (hasDataClassification) {
        impact = Math.max(1, Math.min(5, parseInt(vendorData.data_classification)));
      }

      // Calculate vulnerability based on assessment type
      if (vendorData.assessment_type === 'standard' && vendorData.answers) {
        // Standard assessment: calculate from maturity scores (1-5 scale)
        vulnerability = calculateVulnerability(vendorData.answers, questions, osintResults);
        
        // Convert average maturity score to impact and likelihood
        // Higher maturity scores = better security = lower risk
        const answerValues = Object.values(vendorData.answers);
        const avgScore = answerValues.length > 0 
          ? answerValues.reduce((a, b) => a + b, 0) / answerValues.length 
          : 1; // Default to worst score if no answers
        
        // Only calculate impact from scores if data_classification wasn't provided (backwards compatibility)
        if (!hasDataClassification) {
          impact = Math.max(1, Math.min(5, 6 - avgScore / 1.2));
        }
        
        likelihood = Math.max(1, Math.min(5, 6 - avgScore / 1.2));
        
        // OSINT adjustment: Only ransomware affects likelihood
        // DMARC and SSL issues are informational warnings only - they don't affect likelihood
        if (osintResults && osintResults.ransomware === true) {
          likelihood = 5;
        }
        // Note: DMARC and SSL warnings do NOT affect likelihood calculation
      } else if (vendorData.assessment_type === 'cloud' && vendorData.cloudScores) {
        // Cloud assessment: calculate from maturity scores (0-5 per question)
        const cloudResult = calculateCloudVulnerability(vendorData.cloudScores, cloudCriteria, osintResults);
        vulnerability = cloudResult.vulnerability;
        
        // Score thresholds for likelihood
        // New thresholds: 45-55 Elite (2), 30-44 Standard (3), 15-29 Deficient (4), 0-14 Critical (5)
        const score = cloudResult.score;
        
        // Only calculate impact from score if data_classification wasn't provided (backwards compatibility)
        if (!hasDataClassification) {
          impact = score < 15 ? 5 : (score < 30 ? 4 : (score < 45 ? 3 : 2));
        }
        
        likelihood = score < 15 ? 5 : (score < 30 ? 4 : (score < 45 ? 3 : 2));
        
        // Apply OSINT adjustments
        // Only ransomware affects likelihood - DMARC and SSL affect vulnerability only
        if (osintResults) {
          if (osintResults.ransomware === true) {
            // Ransomware increases likelihood of breach but doesn't change data sensitivity
            likelihood = 5;
          }
          // SSL and DMARC issues affect vulnerability (already applied in calculateCloudVulnerability)
          // SSL expired: vulnerability ≥ 80%
          // DMARC missing: vulnerability ≥ 60%
        }
      }

      // Build the vendor object with all calculated values
      const vendor = {
        ...vendorData,
        impact,
        likelihood,
        vulnerability,
        osint_warnings: vendorData.osint_warnings || [],
        osint_urls: vendorData.osint_urls || {},
        osint_acknowledged: vendorData.osint_acknowledged || false,
      };

      // Save to database (update if vendor has ID, otherwise create new)
      const result = vendor.id 
        ? await api.updateVendor(vendor)
        : await api.saveVendor(vendor);
      
      if (result.success) {
        // Reload data and go back to dashboard
        await loadData();
        setActiveTab('dashboard');
        setSelectedVendor(null);
        setVendorViewMode('view');
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor: ' + error.message);
    }
  };

  // Save settings like organisation name
  const handleSaveSettings = async (settings) => {
    try {
      const result = await api.saveSettings(settings);
      if (result.success) {
        if (settings.orgName) {
          setOrgName(settings.orgName);
        }
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    }
  };

  // Refresh the dashboard data when switching back to it
  useEffect(() => {
    if (isUnlocked && activeTab === 'dashboard') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isUnlocked]);

  // Show loading screen while checking database status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show unlock screen if database is locked
  if (!isUnlocked) {
    return <UnlockScreen onUnlock={handleUnlock} isFirstTime={isFirstTime} />;
  }

  // Helper function to extract OSINT results from vendor object
  // This is a bit messy because OSINT data is stored in warnings JSON
  // TO FIX: Consider storing osintResults as a separate field if this gets more complex
  function extractOSINTResults(vendor) {
    // Check if OSINT results are stored in warnings
    if (vendor.osint_warnings && Array.isArray(vendor.osint_warnings)) {
      const ransomwareWarning = vendor.osint_warnings.find(w => w.type === 'ransomware');
      const sslWarning = vendor.osint_warnings.find(w => w.type === 'ssl');
      const dmarcWarning = vendor.osint_warnings.find(w => w.type === 'dmarc');
      
      return {
        ransomware: ransomwareWarning ? true : false,
        ssl: sslWarning ? (sslWarning.message.includes('expired') ? 'F' : 'C') : null,
        dmarc: dmarcWarning ? false : null
      };
    }
    
    // If osintResults field exists, use it
    if (vendor.osintResults) {
      return vendor.osintResults;
    }
    
    return { ransomware: null, ssl: null, dmarc: null };
  }

  // Sort vendors with "The Knockout" logic per TILT framework:
  // 1. Ransomware found (Critical Risk) - these go to the top
  // 2. Prohibited status - second priority
  // 3. By vulnerability (most vulnerable first) - default sort
  // TO FIX: This sort function gets called on every render, might need memoization if vendor list gets large
  const sortedVendors = [...vendors].sort((a, b) => {
    const aOSINT = extractOSINTResults(a);
    const bOSINT = extractOSINTResults(b);
    
    // Ransomware found = highest priority (show these first)
    if (aOSINT.ransomware === true && bOSINT.ransomware !== true) return -1;
    if (bOSINT.ransomware === true && aOSINT.ransomware !== true) return 1;
    
    // Prohibited status = second priority
    if (a.status === 'Prohibited' && b.status !== 'Prohibited') return -1;
    if (b.status === 'Prohibited' && a.status !== 'Prohibited') return 1;
    
    // Default: sort by vulnerability (higher = more vulnerable = show first)
    return (b.vulnerability || 0) - (a.vulnerability || 0);
  });

  // Vendors are already sorted with flagged vendors (OSINT warnings, ransomware, etc.) at the top

  // Handle vendor card click - open view mode
  const handleVendorClick = (vendor) => {
    setSelectedVendor(vendor);
    setVendorViewMode('view');
    setActiveTab('view_vendor');
  };

  // Handle edit button click from view mode
  const handleEditVendor = () => {
    setVendorViewMode('edit');
  };

  // Handle closing vendor view/edit
  const handleCloseVendor = () => {
    setSelectedVendor(null);
    setVendorViewMode('view');
    setActiveTab('dashboard');
  };

  // Handle deleting a vendor
  const handleDeleteVendor = async (vendorId) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteVendor(vendorId);
      await loadData();
      setSelectedVendor(null);
      setVendorViewMode('view');
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor: ' + error.message);
    }
  };

  // Render different content based on which tab is active
  const renderContent = () => {
    switch(activeTab) {
      case 'view_vendor':
        if (vendorViewMode === 'edit') {
          // Use CloudScorecardForm for cloud assessments, AddVendorForm for standard
          if (selectedVendor?.assessment_type === 'cloud') {
            return (
              <CloudScorecardForm 
                vendor={selectedVendor}
                criteria={cloudCriteria} 
                onSave={handleSaveVendor} 
                onCancel={handleCloseVendor} 
              />
            );
          }
          return (
            <AddVendorForm 
              vendor={selectedVendor}
              questions={questions} 
              cloudCriteria={cloudCriteria}
              onCancel={handleCloseVendor} 
              onSave={handleSaveVendor} 
            />
          );
        }
        return (
          <ViewVendor 
            vendor={selectedVendor}
            questions={questions}
            cloudCriteria={cloudCriteria}
            onEdit={handleEditVendor}
            onClose={handleCloseVendor}
            onDelete={handleDeleteVendor}
            onAcknowledge={loadData}
          />
        );
      case 'add':
        return (
          <AddVendorForm 
            questions={questions} 
            cloudCriteria={cloudCriteria}
            onCancel={() => setActiveTab('dashboard')} 
            onSave={handleSaveVendor} 
          />
        );
      case 'edit_qs':
        return <QuestionEditor questions={questions} onQuestionsChange={loadData} />;
      case 'cloud_fill':
        return <CloudScorecardForm criteria={cloudCriteria} onSave={handleSaveVendor} onCancel={() => setActiveTab('dashboard')} />;
      case 'cloud_edit':
        return <CloudMatrixEditor criteria={cloudCriteria} onCriteriaChange={loadData} />;
      case 'osint':
        return <OSINTPage vendors={vendors} onVendorsChange={loadData} />;
      case 'settings':
        return (
          <SettingsPage 
            orgName={orgName} 
            vendors={vendors}
            onSave={handleSaveSettings} 
            onCancel={() => setActiveTab('dashboard')}
            onDeleteVendor={handleDeleteVendor}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard 
            vendors={sortedVendors}
            onVendorClick={handleVendorClick}
          />
        );
    }
  };

  // Main app layout with sidebar and content area
  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-100">
        <header className="px-8 py-6 flex justify-between items-end shrink-0 bg-gray-100 z-10">
          <div>
            {/* Welcome heading uses Poppins Black in all caps */}
            <h1 className="text-3xl font-light text-gray-600 font-poppins-black">WELCOME BACK!</h1>
            {/* Organisation name uses Poppins Thin in all caps */}
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight font-poppins-thin">{orgName.toUpperCase()}</h2>
          </div>
          {/* Search bar placeholder (not functional yet) */}
          <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 text-gray-400">
            <Search size={16} />
            <span className="text-sm">Search vendors...</span>
          </div>
        </header>

        {/* Main content area that shows different pages based on active tab */}
        <main className="flex-1 overflow-y-auto p-8 pt-2">
          <div className="w-full h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

