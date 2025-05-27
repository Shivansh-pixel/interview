import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Activity, Settings } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4 py-4">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Users
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Analytics
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Interviews</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample data */}
                  <tr className="border-b">
                    <td className="py-2">John Doe</td>
                    <td className="py-2">john@example.com</td>
                    <td className="py-2">5</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Analytics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Total Users</h3>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Total Interviews</h3>
                  <p className="text-2xl font-bold">5,678</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Avg. Duration</h3>
                  <p className="text-2xl font-bold">25 min</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">System Settings</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">API Configuration</h3>
                  <input
                    type="text"
                    placeholder="Gemini API Key"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Interview Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Enable advanced questions
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Allow feedback downloads
                    </label>
                  </div>
                </div>
                <Button>Save Settings</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;