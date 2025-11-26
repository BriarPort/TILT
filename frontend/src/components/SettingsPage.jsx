import React, { useState } from 'react';
import { Save, Lock, Trash2 } from 'lucide-react';
import * as api from '../api';

export default function SettingsPage({ orgName, vendors = [], onSave, onCancel, onDeleteVendor }) {
  const [tempName, setTempName] = useState(orgName);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSave = async () => {
    const settings = { orgName: tempName };
    await onSave(settings);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const result = await api.changePassword(oldPassword, newPassword);
      if (result.success) {
        setPasswordSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || result.detail || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError(error.message || 'An error occurred');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">APPLICATION SETTINGS</h2>
          <p className="text-gray-500 text-sm">Configure global application parameters.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
            <Save size={16}/> Save Settings
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto space-y-8">
        {/* Organisation Name Setting */}
        <div>
          <label htmlFor="org-name" className="block text-lg font-bold text-gray-700 mb-2">
            Organisation Name
          </label>
          <p className="text-sm text-gray-500 mb-4">This name appears in the header and reports.</p>
          <input 
            id="org-name"
            type="text" 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none max-w-sm"
            placeholder="e.g. Example Security"
          />
        </div>

        {/* Password Change Section */}
        <div className="border-t pt-8 border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} className="text-gray-600" />
            <h3 className="text-lg font-bold text-gray-700">Change Master Password</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Change the master password used to encrypt your database. You'll need your current password.
          </p>
          
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
                minLength={8}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
                minLength={8}
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Vendor Management Section */}
        <div className="border-t pt-8 border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={20} className="text-gray-600" />
            <h3 className="text-lg font-bold text-gray-700">Vendor Management</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            View and delete vendors from your database. This action cannot be undone.
          </p>
          
          {vendors.length === 0 ? (
            <p className="text-gray-500 text-sm">No vendors registered.</p>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {vendors.map(vendor => (
                <div 
                  key={vendor.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        vendor.status === 'New' ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {vendor.status}
                      </span>
                      <span>{vendor.assessment_type === 'standard' ? 'Standard Assessment' : 'Cloud Scorecard'}</span>
                      {vendor.osint_warnings && vendor.osint_warnings.length > 0 && (
                        <span className="text-red-600 font-medium">
                          {vendor.osint_warnings.length} OSINT warning{vendor.osint_warnings.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`)) {
                        onDeleteVendor(vendor.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ml-4"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

