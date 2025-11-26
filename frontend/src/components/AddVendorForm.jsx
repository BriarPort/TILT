import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

// Form component for adding a new vendor assessment or editing an existing one
// Supports both standard 25-question assessment and cloud scorecard
export default function AddVendorForm({ questions, cloudCriteria, onSave, onCancel, vendor = null }) {
  const isEditMode = vendor !== null;
  
  // Vendor name input
  const [name, setName] = useState(vendor?.name || '');
  // Data classification level (determines IMPACT score 1-5)
  const [dataClassification, setDataClassification] = useState(
    vendor?.data_classification?.toString() || '3'
  );
  // Relationship status (New or Potential)
  const [status, setStatus] = useState(vendor?.status || 'Potential');
  // Which type of assessment to use - respect vendor's existing type when editing
  const assessmentType = vendor?.assessment_type || 'standard';
  // Answers for standard assessment (question ID to maturity score 1-5)
  const [answers, setAnswers] = useState(vendor?.answers || {});
  // Scores for cloud assessment (criterion ID to maturity score 0-5) - only used if assessmentType is cloud
  const [cloudScores, setCloudScores] = useState(vendor?.cloudScores || {});
  // OSINT URLs for security checks
  const [primaryDomain, setPrimaryDomain] = useState(vendor?.osint_urls?.primary_domain || '');
  const [websiteUrl, setWebsiteUrl] = useState(vendor?.osint_urls?.website_url || '');
  const [trustCenterUrl, setTrustCenterUrl] = useState(vendor?.osint_urls?.trust_center_url || '');
  const [securityPageUrl, setSecurityPageUrl] = useState(vendor?.osint_urls?.security_page_url || '');
  const [dmarcSubdomains, setDmarcSubdomains] = useState(vendor?.osint_urls?.dmarc_subdomains || '');

  // Update the maturity score for a specific question
  const handleScoreChange = (qId, val) => {
    setAnswers(prev => ({...prev, [qId]: val}));
  };


  // Validate and save the vendor assessment
  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a vendor name');
      return;
    }

    // Primary domain is required for OSINT checks
    if (!primaryDomain.trim()) {
      alert('Please enter a primary domain for OSINT security checks (e.g., example.com)');
      return;
    }

    // Build the vendor data object with all the assessment info
    const vendorData = {
      ...(isEditMode && { id: vendor.id }), // Include ID if editing
      name: name.trim(),
      status,
      data_classification: parseInt(dataClassification), // Store classification tier (1-5)
      assessment_type: assessmentType,
      answers: assessmentType === 'standard' ? answers : undefined,
      cloudScores: assessmentType === 'cloud' ? cloudScores : undefined,
      weakness: vendor?.weakness || 'To be assessed',
      strength: vendor?.strength || 'To be assessed',
      // OSINT URLs for automated security checks
      osint_urls: {
        primary_domain: primaryDomain.trim(),
        website_url: websiteUrl.trim() || undefined,
        trust_center_url: trustCenterUrl.trim() || undefined,
        security_page_url: securityPageUrl.trim() || undefined,
        dmarc_subdomains: dmarcSubdomains.trim() || undefined,
      },
    };

    // Send to parent component to calculate risk and save
    onSave(vendorData);
  };

  // Calculate current score for visual feedback (standard assessment only)
  const currentScore = Object.values(answers).reduce((a, b) => a + parseInt(b || 0), 0);
  const maxScore = questions.length * 5;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          {/* Subtitle uses Poppins Thin in all caps */}
          <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">
            {isEditMode ? 'EDIT THIRD-PARTY ASSESSMENT' : 'NEW THIRD-PARTY ASSESSMENT'}
          </h2>
          <p className="text-gray-500 text-sm">Inherent Risk & Maturity Questionnaire</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
            <Save size={16}/> Save Vendor
          </button>
        </div>
      </div>
      
      <div className="p-8 overflow-y-auto flex-1 space-y-8">
        {/* Vendor Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vendor Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Acme Services Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Data Classification Level <span className="text-gray-500 font-normal text-xs">(Sets IMPACT Score)</span>
            </label>
            <select 
              value={dataClassification}
              onChange={(e) => setDataClassification(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="1">Tier 1 - Public (Impact: 1)</option>
              <option value="2">Tier 2 - Internal (Impact: 2)</option>
              <option value="3">Tier 3 - Confidential (Impact: 3)</option>
              <option value="4">Tier 4 - Restricted (Impact: 4)</option>
              <option value="5">Tier 5 - Highly Restricted (Impact: 5)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">The data classification level they handle/will handle determines the IMPACT axis placement</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Relationship Status</label>
            <div className="flex gap-4 mt-1">
              <button 
                onClick={() => setStatus('New')}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  status === 'New' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  status === 'New' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                }`} />
                New Party
              </button>
              <button 
                onClick={() => setStatus('Potential')}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  status === 'Potential' ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold' : 'border-gray-200 text-gray-500'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  status === 'Potential' ? 'border-amber-600 bg-amber-600' : 'border-gray-400'
                }`} />
                Potential
              </button>
            </div>
          </div>
        </div>

        {/* OSINT URLs Section - Required for automated security checks */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-bold text-blue-800 font-poppins-thin">OSINT INFORMATION</span>
            <span className="text-xs text-red-600 font-bold">(Required)</span>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            These URLs are used for automated security checks and OSINT analysis. The primary domain is required.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Primary Domain <span className="text-red-600">*</span>
              </label>
              <input 
                type="text" 
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="example.com (without https:// or www)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used for breach checks, SSL validation, and security ratings</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Website URL (Optional)</label>
                <input 
                  type="url" 
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Trust Center URL (Optional)</label>
                <input 
                  type="url" 
                  value={trustCenterUrl}
                  onChange={(e) => setTrustCenterUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/trust-center"
                />
                <p className="text-xs text-gray-500 mt-1">For cloud providers (SOC 2, ISO 27001 info)</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Security Page URL (Optional)</label>
              <input 
                type="url" 
                value={securityPageUrl}
                onChange={(e) => setSecurityPageUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://example.com/security"
              />
              <p className="text-xs text-gray-500 mt-1">Security documentation, compliance pages, or security.txt location</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                DMARC-Enabled Email Subdomains <span className="text-gray-500 font-normal text-xs">(Optional)</span>
              </label>
              <input 
                type="text" 
                value={dmarcSubdomains}
                onChange={(e) => setDmarcSubdomains(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="notifications.example.com, noreply.example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of subdomains that send email (e.g., notifications.github.com). 
                DMARC will be checked on these instead of the primary domain. Leave empty to check primary domain.
              </p>
            </div>
          </div>
        </div>


        {/* Standard assessment questionnaire with all 25 questions */}
        {assessmentType === 'standard' && (
          <div>
            {/* Subtitle uses Poppins Thin in all caps */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 font-poppins-thin">MATURITY ASSESSMENT</h3>
            <div className="space-y-6">
              {questions.map(q => {
                // Parse maturity_levels if it's a string (from database) or use object directly
                const maturityLevels = typeof q.maturity_levels === 'string' 
                  ? JSON.parse(q.maturity_levels) 
                  : (q.maturity_levels || {});
                
                return (
                  <div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{q.category}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        q.weight === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>{q.weight}</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-4">{q.question}</p>
                    {/* Multiple choice options with metric descriptions */}
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map(score => {
                        const optionText = maturityLevels[score.toString()] || '';
                        const isSelected = answers[q.id] === score;
                        
                        return (
                          <button
                            key={score}
                            onClick={() => handleScoreChange(q.id, score)}
                            className={`w-full text-left p-3 rounded border transition-all ${
                              isSelected
                                ? 'bg-blue-100 border-blue-400 text-blue-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
                              }`}>
                                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                              <div className="flex-1">
                                {optionText ? (
                                  <span className="text-sm">{optionText}</span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Option {score} (description not available)</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200 text-right text-sm text-gray-500">
              Current Assessment Score: <span className="font-bold text-gray-900">{currentScore} / {maxScore}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

