import React, { useState } from 'react';
import { Pencil, Plus, X, Save, Trash2, AlertTriangle } from 'lucide-react';
import * as api from '../api';

export default function CloudMatrixEditor({ criteria, onCriteriaChange }) {
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    criterion: '',
    category: '',
    description: '',
    criticality: 'Medium',
    points: 3,
    osint_source: '',
    maturity_levels: {},
    notes: ''
  });

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingCriterion(null);
    setFormData({
      criterion: '',
      category: '',
      description: '',
      criticality: 'Medium',
      points: 3,
      osint_source: '',
      maturity_levels: { '0': '', '1': '', '2': '', '3': '', '4': '', '5': '' },
      notes: ''
    });
  };

  const handleEditClick = (criterion) => {
    setIsAdding(false);
    setEditingCriterion(criterion);
    const maturityLevels = typeof criterion.maturity_levels === 'string' 
      ? JSON.parse(criterion.maturity_levels) 
      : (criterion.maturity_levels || {});
    
    setFormData({
      criterion: criterion.criterion || '',
      category: criterion.category || '',
      description: criterion.description || '',
      criticality: criterion.criticality || 'Medium',
      points: criterion.points || 3,
      osint_source: criterion.osint_source || '',
      maturity_levels: maturityLevels,
      notes: criterion.notes || ''
    });
  };

  const handleCloseModal = () => {
    setEditingCriterion(null);
    setIsAdding(false);
    setFormData({
      criterion: '',
      category: '',
      description: '',
      criticality: 'Medium',
      points: 3,
      osint_source: '',
      maturity_levels: {},
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!formData.criterion.trim()) {
      alert('Please enter a criterion');
      return;
    }

    try {
      const criterionData = {
        ...(editingCriterion && { id: editingCriterion.id }),
        criterion: formData.criterion.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        criticality: formData.criticality,
        points: parseInt(formData.points) || 0,
        osint_source: formData.osint_source.trim() || null,
        maturity_levels: formData.maturity_levels,
        notes: formData.notes.trim() || null
      };

      await api.saveCloudCriterion(criterionData);
      await onCriteriaChange();
      handleCloseModal();
    } catch (error) {
      alert('Failed to save criterion: ' + error.message);
    }
  };

  const handleDelete = async (criterionId) => {
    if (!confirm('Are you sure you want to delete this criterion?')) {
      return;
    }

    try {
      await api.deleteCloudCriterion(criterionId);
      await onCriteriaChange();
    } catch (error) {
      alert('Failed to delete criterion: ' + error.message);
    }
  };

  const updateMaturityLevel = (level, value) => {
    setFormData(prev => ({
      ...prev,
      maturity_levels: {
        ...prev.maturity_levels,
        [level]: value
      }
    }));
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">CLOUD MATRIX CONFIGURATION</h2>
            <p className="text-gray-500 text-sm">Edit the scoring criteria for Mass-Market assessments.</p>
          </div>
          <button 
            onClick={handleAddClick}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Criteria
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {criteria.map(c => (
            <div key={c.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center hover:border-gray-300 transition-colors group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {c.category}
                  </span>
                  {c.criticality === 'Critical' && <AlertTriangle size={12} className="text-red-500"/>}
                </div>
                <p className="text-gray-800 font-medium">{c.criterion}</p>
                {c.description && (
                  <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                )}
                {c.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Notes:</strong> {c.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-900">{c.points} pts</span>
                  <span className={`text-xs ${
                    c.criticality === 'Critical' ? 'text-red-500 font-bold' : 'text-gray-400'
                  }`}>{c.criticality}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClick(c)}
                    className="text-gray-300 hover:text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="text-gray-300 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {(editingCriterion || isAdding) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800 font-poppins-thin">
                {isAdding ? 'Add Criteria' : 'Edit Criteria'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Fields */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Criterion <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.criterion}
                  onChange={(e) => setFormData(prev => ({ ...prev, criterion: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  placeholder="Enter the criterion text..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Compliance (ISO)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Criticality</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData(prev => ({ ...prev, criticality: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Points</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">OSINT Source</label>
                <input
                  type="text"
                  value={formData.osint_source}
                  onChange={(e) => setFormData(prev => ({ ...prev, osint_source: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Trust Center / ISO Certificate Download"
                />
              </div>

              {/* Maturity Levels (0-5) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Maturity Levels (0-5)</label>
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5].map(level => (
                    <div key={level}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Level {level}
                      </label>
                      <input
                        type="text"
                        value={formData.maturity_levels[level.toString()] || ''}
                        onChange={(e) => updateMaturityLevel(level.toString(), e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder={`Enter description for maturity level ${level}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes <span className="text-gray-500 font-normal text-xs">(Only visible on this page)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Internal notes about this criterion..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
