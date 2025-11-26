import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { calculateCloudVulnerability } from '../utils/riskCalculator';

export default function CloudScorecardForm({ criteria, onSave, onCancel, vendor = null }) {
  const isEditMode = vendor !== null;
  const [vendorName, setVendorName] = useState(vendor?.name || '');
  // Relationship status (New or Potential)
  const [status, setStatus] = useState(vendor?.status || 'Potential');
  // Data classification level (determines IMPACT score 1-5)
  const [dataClassification, setDataClassification] = useState(vendor?.data_classification?.toString() || '3'); // Default to Tier 3
  // OSINT URLs for security checks
  const [primaryDomain, setPrimaryDomain] = useState(vendor?.osint_urls?.primary_domain || '');
  const [dmarcSubdomains, setDmarcSubdomains] = useState(vendor?.osint_urls?.dmarc_subdomains || '');
  // Scores: { questionId: { selectedLevels: [0,1,2], finalScore: 3 } }
  // Initialize scores - handle both old format (flat object) and new format (nested object)
  const initializeScores = () => {
    try {
      if (!vendor?.cloudScores) return {};
      
      // Check if it's the old format (flat: { questionId: score }) or new format (nested: { questionId: { finalScore: score } })
      const firstKey = Object.keys(vendor.cloudScores)[0];
      if (firstKey && typeof vendor.cloudScores[firstKey] === 'number') {
        // Old format - convert to new format
        const converted = {};
        Object.keys(vendor.cloudScores).forEach(id => {
          const scoreValue = vendor.cloudScores[id];
          if (scoreValue !== null && scoreValue !== undefined) {
            converted[id] = {
              selectedLevels: [],
              finalScore: scoreValue
            };
          }
        });
        return converted;
      }
      // New format - use as is, but ensure structure is correct
      const normalized = {};
      Object.keys(vendor.cloudScores).forEach(id => {
        const scoreData = vendor.cloudScores[id];
        if (typeof scoreData === 'object' && scoreData !== null) {
          normalized[id] = {
            selectedLevels: scoreData.selectedLevels || [],
            finalScore: scoreData.finalScore !== undefined ? scoreData.finalScore : null
          };
        }
      });
      return normalized;
    } catch (error) {
      console.error('Error initializing scores:', error);
      return {};
    }
  };
  
  const [scores, setScores] = useState(initializeScores());

  // Toggle a maturity level selection for a question (can select multiple)
  const toggleLevel = (questionId, level) => {
    setScores(prev => {
      const current = prev[questionId] || { selectedLevels: [], finalScore: null };
      const newLevels = current.selectedLevels.includes(level)
        ? current.selectedLevels.filter(l => l !== level)
        : [...current.selectedLevels, level].sort((a, b) => a - b);
      
      // Don't auto-populate finalScore - user must enter it manually
      return {
        ...prev,
        [questionId]: {
          selectedLevels: newLevels,
          finalScore: current.finalScore  // Keep existing value, don't auto-set
        }
      };
    });
  };

  // Set final score for a question (user override)
  const setFinalScore = (questionId, score) => {
    try {
      // Handle empty string
      if (score === '' || score === null || score === undefined) {
        setScores(prev => {
          const current = prev[questionId] || { selectedLevels: [], finalScore: null };
          return {
            ...prev,
            [questionId]: {
              ...current,
              finalScore: null
            }
          };
        });
        return;
      }
      
      // Parse and validate score
      const parsedScore = parseInt(score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
        // Invalid score - don't update, but don't crash
        return;
      }
      
      setScores(prev => {
        const current = prev[questionId] || { selectedLevels: [], finalScore: null };
        return {
          ...prev,
          [questionId]: {
            selectedLevels: current.selectedLevels || [],
            finalScore: parsedScore
          }
        };
      });
    } catch (error) {
      console.error('Error setting final score:', error);
      // Don't crash - just log the error
    }
  };

  const handleSave = () => {
    if (!vendorName.trim()) {
      alert('Please enter a cloud provider name');
      return;
    }

    // Primary domain is required for OSINT checks
    if (!primaryDomain.trim()) {
      alert('Please enter a primary domain for OSINT security checks (e.g., example.com)');
      return;
    }

    // Convert scores to format expected by calculator: { questionId: finalScore }
    const finalScores = {};
    criteria.forEach(c => {
      const scoreData = scores[c.id];
      if (scoreData && scoreData.finalScore !== null && scoreData.finalScore !== undefined) {
        finalScores[c.id] = scoreData.finalScore;
      }
    });

    const result = calculateCloudVulnerability(finalScores, criteria);
    
    const vendorData = {
      ...(isEditMode && { id: vendor.id }), // Include ID if editing
      name: vendorName.trim(),
      status,
      data_classification: parseInt(dataClassification), // Store classification tier (1-5)
      assessment_type: 'cloud',
      cloudScores: finalScores,
      impact: parseInt(dataClassification), // Impact is set by data classification level
      likelihood: result.score >= 45 ? 2 : result.score >= 30 ? 3 : result.score >= 15 ? 4 : 5,
      vulnerability: result.vulnerability,
      weakness: result.score < 15 ? 'Critical Risk - Does not meet minimum safety standards' : 
                result.score < 30 ? 'Deficient - High Risk' : 
                result.score < 45 ? 'Standard - Medium Risk' : 'None observed',
      strength: result.score >= 45 ? 'Elite - Market-leading security maturity' : 
                result.score >= 30 ? 'Standard - Acceptable security controls' : 
                result.score >= 15 ? 'Restricted - Acceptable only for Internal/Public Data' : 
                'Critical Risk - Usage blocked',
      // OSINT URLs for automated security checks
      osint_urls: {
        primary_domain: primaryDomain.trim(),
        dmarc_subdomains: dmarcSubdomains.trim() || undefined,
      },
    };

    onSave(vendorData);
  };

  // Calculate current total score with error handling
  let finalScores = {};
  let result = { score: 0, maxScore: 55, vulnerability: 100, status: 'REJECT (Critical Risk)', statusColor: 'red' };
  let totalScore = 0;
  const maxScore = 55; // Total points available
  
  try {
    if (criteria && Array.isArray(criteria) && criteria.length > 0) {
      criteria.forEach(c => {
        if (c && c.id !== undefined) {
          const scoreData = scores[c.id];
          // Handle both old format (number) and new format (object with finalScore)
          if (scoreData !== undefined && scoreData !== null) {
            if (typeof scoreData === 'number') {
              // Old format - direct number
              finalScores[c.id] = scoreData;
            } else if (scoreData.finalScore !== null && scoreData.finalScore !== undefined) {
              // New format - object with finalScore property
              finalScores[c.id] = scoreData.finalScore;
            }
          }
        }
      });
      result = calculateCloudVulnerability(finalScores, criteria);
      totalScore = result?.score || 0;
    }
  } catch (error) {
    console.error('Error calculating cloud vulnerability:', error);
    console.error('Scores:', scores);
    console.error('Criteria:', criteria);
    // Use default values on error to prevent crash
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col max-w-5xl mx-auto">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">MASS-MARKET CLOUD SCORECARD</h2>
        <p className="text-gray-500 text-sm">Maturity-Based Assessment (0-5 per question, Total: 55 points)</p>
      </div>

      <div className="p-8 overflow-y-auto flex-1">
        <div className="mb-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cloud Provider Name</label>
              <input 
                type="text" 
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Dropbox, Zoom"
              />
            </div>
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
            <p className="text-xs text-gray-500 mt-1">Required for OSINT security checks</p>
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

        <div className="space-y-6">
          {criteria.map(c => {
            const scoreData = scores[c.id] || { selectedLevels: [], finalScore: null };
            const suggestedScore = scoreData.selectedLevels.length > 0 
              ? Math.max(...scoreData.selectedLevels) 
              : null;
            // Parse maturity_levels if it's a string (from database) or use object directly
            const maturityLevels = typeof c.maturity_levels === 'string' 
              ? JSON.parse(c.maturity_levels) 
              : (c.maturity_levels || {});

            return (
              <div key={c.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {c.category}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          c.criticality === 'Critical' ? 'bg-red-100 text-red-600' : 
                          c.criticality === 'High' ? 'bg-orange-100 text-orange-600' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.criticality}
                        </span>
                        <span className="text-xs text-gray-500">Max: {c.points} pts</span>
                      </div>
                      <p className="font-medium text-gray-800 text-base mb-2">{c.criterion}</p>
                      {c.description && (
                        <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Answer options - 6x2 grid layout, multiple selections allowed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {[0, 1, 2, 3, 4, 5].map(level => {
                      const optionText = maturityLevels[level.toString()] || '';
                      const isSelected = scoreData.selectedLevels.includes(level);
                      
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleLevel(c.id, level)}
                          className={`text-left p-3 rounded border transition-all ${
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
                                <span className="text-sm text-gray-400 italic">Option {level} (description not available)</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggested score and final score input */}
                  <div className="flex items-center gap-4 bg-white p-3 rounded border border-gray-200">
                    {suggestedScore !== null && (
                      <div className="text-sm">
                        <span className="text-gray-600">Suggested score = </span>
                        <span className="font-bold text-blue-600">{suggestedScore}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm font-medium text-gray-700">Final Score:</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={scoreData.finalScore !== null && scoreData.finalScore !== undefined ? scoreData.finalScore : ''}
                        onChange={(e) => {
                          try {
                            setFinalScore(c.id, e.target.value);
                          } catch (error) {
                            console.error('Error in onChange handler:', error);
                          }
                        }}
                        onBlur={(e) => {
                          // Validate on blur - ensure value is within range
                          const value = e.target.value;
                          if (value !== '' && (isNaN(value) || parseInt(value) < 0 || parseInt(value) > 5)) {
                            e.target.value = scoreData.finalScore !== null ? scoreData.finalScore : '';
                          }
                        }}
                        placeholder={suggestedScore !== null ? suggestedScore.toString() : '0-5'}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-xs text-gray-500">/ 5</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Score Result</p>
            <p className="text-3xl font-bold text-gray-900">{totalScore} <span className="text-lg text-gray-500 font-normal">/ {maxScore}</span></p>
          </div>
          <div className={`px-6 py-3 rounded-lg font-bold text-lg shadow-md ${
            result.statusColor === 'red' ? 'bg-red-600 text-white' :
            result.statusColor === 'amber' ? 'bg-amber-500 text-white' :
            result.statusColor === 'yellow' ? 'bg-yellow-500 text-white' :
            'bg-green-500 text-white'
          }`}>
            {result.status}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <Save size={16} /> Save Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
