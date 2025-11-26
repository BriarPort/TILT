import React, { useState } from 'react';
import { ArrowLeft, Edit, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import * as api from '../api';

// Component to view full vendor assessment details with dates
export default function ViewVendor({ vendor, questions, cloudCriteria, onEdit, onClose, onDelete, onAcknowledge }) {
  const [isAcknowledged, setIsAcknowledged] = useState(vendor?.osint_acknowledged || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAcknowledgeChange = async (checked) => {
    setIsAcknowledged(checked);
    setIsSaving(true);
    
    try {
      // Update vendor with acknowledgment status
      const vendorData = {
        ...vendor,
        osint_acknowledged: checked
      };
      await api.updateVendor(vendorData);
      if (onAcknowledge) {
        onAcknowledge();
      }
    } catch (error) {
      console.error('Error updating acknowledgment:', error);
      // Revert on error
      setIsAcknowledged(!checked);
      alert('Failed to update acknowledgment: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDataClassificationLabel = (tier) => {
    const labels = {
      1: 'Tier 1 - Public',
      2: 'Tier 2 - Internal',
      3: 'Tier 3 - Confidential',
      4: 'Tier 4 - Restricted',
      5: 'Tier 5 - Highly Restricted'
    };
    return labels[tier] || `Tier ${tier}`;
  };

  const getMaturityLevelLabel = (level) => {
    const labels = {
      0: 'Not Implemented',
      1: 'Initial',
      2: 'Developing',
      3: 'Defined',
      4: 'Managed',
      5: 'Optimized'
    };
    return labels[level] || level;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">{vendor.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className={`font-bold ${
                vendor.status === 'Active' ? 'text-green-600' : 
                vendor.status === 'New' ? 'text-blue-600' : 'text-amber-600'
              }`}>
                {vendor.status}
              </span>
              <span className="text-gray-400">•</span>
              <span>{vendor.assessment_type === 'standard' ? 'Standard Assessment' : 'Cloud Scorecard'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Edit size={16} /> Edit Assessment
          </button>
          <button
            onClick={() => onDelete(vendor.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} /> Delete Vendor
          </button>
        </div>
      </div>

      <div className="p-8 overflow-y-auto flex-1 space-y-8">
        {/* Assessment Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Created</p>
              <p className="text-sm text-gray-800 font-medium mt-1">
                {formatDate(vendor.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Last Updated</p>
              <p className="text-sm text-gray-800 font-medium mt-1">
                {formatDate(vendor.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Scores Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">Impact</p>
            <p className="text-2xl font-bold text-blue-800">{vendor.impact?.toFixed(1) || 'N/A'}</p>
            <p className="text-xs text-blue-600 mt-1">
              {vendor.data_classification ? getDataClassificationLabel(vendor.data_classification) : 'Based on assessment'}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-600 uppercase tracking-wider font-bold mb-1">Likelihood</p>
            <p className="text-2xl font-bold text-orange-800">{vendor.likelihood?.toFixed(1) || 'N/A'}</p>
            <p className="text-xs text-orange-600 mt-1">Chance of breach</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 uppercase tracking-wider font-bold mb-1">Vulnerability</p>
            <p className="text-2xl font-bold text-purple-800">{vendor.vulnerability || 0}%</p>
            <p className="text-xs text-purple-600 mt-1">Security posture</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-1">Risk Score</p>
            <p className="text-2xl font-bold text-gray-800">
              {vendor.impact && vendor.likelihood ? (vendor.impact * vendor.likelihood).toFixed(1) : 'N/A'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Impact × Likelihood</p>
          </div>
        </div>

        {/* Data Classification */}
        {vendor.data_classification && (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-600 uppercase tracking-wider font-bold mb-1">Data Classification Level</p>
            <p className="text-base text-indigo-800 font-medium">
              {getDataClassificationLabel(vendor.data_classification)} (Impact: {vendor.data_classification})
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              This vendor handles/will handle data at this classification level
            </p>
          </div>
        )}

        {/* OSINT URLs */}
        {vendor.osint_urls && vendor.osint_urls.primary_domain && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-3">OSINT Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {vendor.osint_urls.primary_domain && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Primary Domain</p>
                  <p className="text-gray-800">{vendor.osint_urls.primary_domain}</p>
                </div>
              )}
              {vendor.osint_urls.website_url && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Website URL</p>
                  <p className="text-gray-800 break-all">{vendor.osint_urls.website_url}</p>
                </div>
              )}
              {vendor.osint_urls.trust_center_url && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Trust Center URL</p>
                  <p className="text-gray-800 break-all">{vendor.osint_urls.trust_center_url}</p>
                </div>
              )}
              {vendor.osint_urls.security_page_url && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Security Page URL</p>
                  <p className="text-gray-800 break-all">{vendor.osint_urls.security_page_url}</p>
                </div>
              )}
              {vendor.osint_urls.dmarc_subdomains && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">DMARC-Enabled Email Subdomains</p>
                  <p className="text-gray-800 break-all">{vendor.osint_urls.dmarc_subdomains}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment Answers */}
        {vendor.assessment_type === 'standard' && vendor.answers && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 font-poppins-thin">ASSESSMENT ANSWERS</h3>
            <div className="space-y-4">
              {questions
                .filter(q => vendor.answers.hasOwnProperty(q.id))
                .map(q => {
                  const answerValue = vendor.answers[q.id];
                  return (
                    <div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{q.category}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          q.weight === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>{q.weight}</span>
                      </div>
                      <p className="text-gray-900 font-medium mb-3">{q.question}</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
                          answerValue === 5 ? 'bg-green-600 text-white' :
                          answerValue === 4 ? 'bg-blue-600 text-white' :
                          answerValue === 3 ? 'bg-yellow-500 text-white' :
                          answerValue === 2 ? 'bg-orange-500 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {answerValue}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {getMaturityLevelLabel(answerValue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Cloud Scorecard Answers */}
        {vendor.assessment_type === 'cloud' && vendor.cloudScores && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 font-poppins-thin">CLOUD SCORECARD ANSWERS</h3>
            <div className="space-y-4">
              {cloudCriteria
                .filter(c => vendor.cloudScores.hasOwnProperty(c.id))
                .map(c => {
                  const scoreValue = vendor.cloudScores[c.id];
                  const maturityLevels = typeof c.maturity_levels === 'string' 
                    ? JSON.parse(c.maturity_levels) 
                    : (c.maturity_levels || {});
                  const levelLabel = maturityLevels[scoreValue?.toString()] || getMaturityLevelLabel(scoreValue);
                  
                  return (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{c.category}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          c.criticality === 'Critical' ? 'bg-red-100 text-red-600' : 
                          c.criticality === 'High' ? 'bg-orange-100 text-orange-600' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.criticality}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-3">{c.criterion}</p>
                      {c.description && (
                        <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
                          scoreValue === 5 ? 'bg-green-600 text-white' :
                          scoreValue === 4 ? 'bg-blue-600 text-white' :
                          scoreValue === 3 ? 'bg-yellow-500 text-white' :
                          scoreValue === 2 ? 'bg-orange-500 text-white' :
                          scoreValue === 1 ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {scoreValue}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">/ 5 - {levelLabel}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Weakness and Strength */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendor.weakness && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wider font-bold mb-2">Weakness</p>
              <p className="text-sm text-red-800">{vendor.weakness}</p>
            </div>
          )}
          {vendor.strength && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 uppercase tracking-wider font-bold mb-2">Strength</p>
              <p className="text-sm text-green-800">{vendor.strength}</p>
            </div>
          )}
        </div>

        {/* OSINT Warnings */}
        {vendor.osint_warnings && vendor.osint_warnings.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-yellow-600 uppercase tracking-wider font-bold">OSINT Warnings ({vendor.osint_warnings.length})</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => handleAcknowledgeChange(e.target.checked)}
                  disabled={isSaving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Risk Team Acknowledged
                </span>
              </label>
            </div>
            {!isAcknowledged && (
              <div className="space-y-2">
                {vendor.osint_warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm text-yellow-800">
                    • <span className="font-medium">{warning.type}:</span> {warning.message}
                  </div>
                ))}
              </div>
            )}
            {isAcknowledged && (
              <p className="text-sm text-yellow-700 italic">
                OSINT risks have been acknowledged by the risk team.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

