import React, { useState } from 'react';
import { Pencil, Plus, X, Save, Trash2 } from 'lucide-react';
import * as api from '../api';

export default function QuestionEditor({ questions, onQuestionsChange }) {
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    category: '',
    nist_control: '',
    policy_ref: '',
    weight: 'High',
    maturity_levels: {},
    notes: ''
  });

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingQuestion(null);
    setFormData({
      question: '',
      category: '',
      nist_control: '',
      policy_ref: '',
      weight: 'High',
      maturity_levels: { '1': '', '2': '', '3': '', '4': '', '5': '' },
      notes: ''
    });
  };

  const handleEditClick = (question) => {
    setIsAdding(false);
    setEditingQuestion(question);
    const maturityLevels = typeof question.maturity_levels === 'string' 
      ? JSON.parse(question.maturity_levels) 
      : (question.maturity_levels || {});
    
    setFormData({
      question: question.question || '',
      category: question.category || '',
      nist_control: question.nist_control || '',
      policy_ref: question.policy_ref || '',
      weight: question.weight || 'High',
      maturity_levels: maturityLevels,
      notes: question.notes || ''
    });
  };

  const handleCloseModal = () => {
    setEditingQuestion(null);
    setIsAdding(false);
    setFormData({
      question: '',
      category: '',
      nist_control: '',
      policy_ref: '',
      weight: 'High',
      maturity_levels: {},
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!formData.question.trim()) {
      alert('Please enter a question');
      return;
    }

    try {
      const questionData = {
        ...(editingQuestion && { id: editingQuestion.id }),
        question: formData.question.trim(),
        category: formData.category.trim() || null,
        nist_control: formData.nist_control.trim() || null,
        policy_ref: formData.policy_ref.trim() || null,
        weight: formData.weight,
        maturity_levels: formData.maturity_levels,
        notes: formData.notes.trim() || null
      };

      await api.saveQuestion(questionData);
      await onQuestionsChange();
      handleCloseModal();
    } catch (error) {
      alert('Failed to save question: ' + error.message);
    }
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.deleteQuestion(questionId);
      await onQuestionsChange();
    } catch (error) {
      alert('Failed to delete question: ' + error.message);
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
            <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">ASSESSMENT CRITERIA</h2>
            <p className="text-gray-500 text-sm">Manage the questions used to calculate inherent risk.</p>
          </div>
          <button 
            onClick={handleAddClick}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Question
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="p-4 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {q.category}
                  </span>
                  {q.nist_control && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {q.nist_control}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClick(q)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-gray-800 font-medium mb-2">{q.question}</p>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  q.weight === 'Critical' ? 'bg-red-100 text-red-700' : 
                  q.weight === 'High' ? 'bg-orange-100 text-orange-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  {q.weight}
                </span>
                {q.policy_ref && (
                  <span className="text-xs text-gray-500">Policy: {q.policy_ref}</span>
                )}
              </div>
              {q.notes && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Notes:</strong> {q.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {(editingQuestion || isAdding) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800 font-poppins-thin">
                {isAdding ? 'Add Question' : 'Edit Question'}
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
                  Question <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Enter the question text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Govern, Protect"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Weight</label>
                  <select
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">NIST Control</label>
                  <input
                    type="text"
                    value={formData.nist_control}
                    onChange={(e) => setFormData(prev => ({ ...prev, nist_control: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., GV.SC-03"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Policy Reference</label>
                  <input
                    type="text"
                    value={formData.policy_ref}
                    onChange={(e) => setFormData(prev => ({ ...prev, policy_ref: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Sec 4, Sec 10"
                  />
                </div>
              </div>

              {/* Maturity Levels (1-5) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Maturity Levels (1-5)</label>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(level => (
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
                  placeholder="Internal notes about this question..."
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
