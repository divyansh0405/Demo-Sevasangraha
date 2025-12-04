import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import pharmacyService from '../../services/pharmacyService';
import type { PharmacyLocation } from '../../types/pharmacy';

const PharmacySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'locations' | 'general'>('locations');
  const [locations, setLocations] = useState<PharmacyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PharmacyLocation | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    type: 'shelf' as 'shelf' | 'refrigerator' | 'controlled-cabinet' | 'crash-cart' | 'quarantine' | 'other',
    description: '',
    temperature_min: '',
    temperature_max: '',
  });
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const locs = await pharmacyService.getPharmacyLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      if (!locationForm.name || !locationForm.type) {
        alert('Please fill all required fields');
        return;
      }

      setSavingLocation(true);

      const locationData = {
        name: locationForm.name,
        type: locationForm.type,
        description: locationForm.description || undefined,
        temperature_min: locationForm.temperature_min ? parseFloat(locationForm.temperature_min) : undefined,
        temperature_max: locationForm.temperature_max ? parseFloat(locationForm.temperature_max) : undefined,
      };

      if (editingLocation) {
        await pharmacyService.updatePharmacyLocation(editingLocation.id, locationData);
        alert('Location updated successfully!');
      } else {
        await pharmacyService.addPharmacyLocation(locationData);
        alert('Location added successfully!');
      }

      setShowAddLocationModal(false);
      setEditingLocation(null);
      setLocationForm({
        name: '',
        type: 'shelf',
        description: '',
        temperature_min: '',
        temperature_max: '',
      });

      loadLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleEditLocation = (location: PharmacyLocation) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      type: location.type,
      description: location.description || '',
      temperature_min: location.temperature_min?.toString() || '',
      temperature_max: location.temperature_max?.toString() || '',
    });
    setShowAddLocationModal(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      await pharmacyService.deletePharmacyLocation(locationId);
      alert('Location deleted successfully!');
      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. It may be in use.');
    }
  };

  const getLocationTypeBadge = (type: string) => {
    const badges = {
      shelf: 'bg-blue-100 text-blue-800',
      refrigerator: 'bg-cyan-100 text-cyan-800',
      'controlled-cabinet': 'bg-red-100 text-red-800',
      'crash-cart': 'bg-orange-100 text-orange-800',
      quarantine: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const badgeColor = badges[type as keyof typeof badges] || badges.other;

    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>{type}</span>;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-[#0056B3]" />
          Pharmacy Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure pharmacy system preferences</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-[#0056B3] text-[#0056B3]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Storage Locations
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-[#0056B3] text-[#0056B3]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'locations' && (
        <div>
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Manage storage locations for inventory</p>
            <Button
              onClick={() => {
                setEditingLocation(null);
                setLocationForm({
                  name: '',
                  type: 'shelf',
                  description: '',
                  temperature_min: '',
                  temperature_max: '',
                });
                setShowAddLocationModal(true);
              }}
              className="bg-[#0056B3] hover:bg-[#004494]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>

          {/* Locations List */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B3] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading locations...</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No storage locations configured</p>
                <Button onClick={() => setShowAddLocationModal(true)} className="mt-4" variant="outline">
                  Add First Location
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                            <p className="text-sm font-medium text-gray-900">{location.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getLocationTypeBadge(location.type)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {location.temperature_min !== null && location.temperature_max !== null ? (
                            <p className="text-sm text-gray-900">
                              {location.temperature_min}°C - {location.temperature_max}°C
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Not specified</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{location.description || 'No description'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleEditLocation(location)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLocation(location.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'general' && (
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">General Preferences</h3>

            <div className="space-y-4">
              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Low Stock Threshold
                </label>
                <Input type="number" placeholder="e.g., 10" min="0" />
                <p className="text-xs text-gray-500 mt-1">
                  Default minimum quantity before low stock alert is triggered
                </p>
              </div>

              {/* Expiry Warning Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Warning (Days)
                </label>
                <Input type="number" placeholder="e.g., 90" min="1" />
                <p className="text-xs text-gray-500 mt-1">Days before expiry to show warning</p>
              </div>

              {/* Auto-generate Batch Numbers */}
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" id="auto-batch" />
                <label htmlFor="auto-batch" className="text-sm text-gray-700">
                  Auto-generate batch numbers
                </label>
              </div>

              {/* Require Two-Pharmacist Verification */}
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" id="two-pharmacist" />
                <label htmlFor="two-pharmacist" className="text-sm text-gray-700">
                  Require two-pharmacist verification for high-alert medications
                </label>
              </div>

              <div className="pt-4">
                <Button className="bg-[#0056B3] hover:bg-[#004494]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">Important Note</h4>
                <p className="text-sm text-gray-600 mt-1">
                  General settings are currently under development. Storage location management is fully functional.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add/Edit Location Modal */}
      <Modal
        isOpen={showAddLocationModal}
        onClose={() => {
          setShowAddLocationModal(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      >
        <div className="space-y-4">
          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              placeholder="e.g., Shelf A1"
              required
            />
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={locationForm.type}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  type: e.target.value as
                    | 'shelf'
                    | 'refrigerator'
                    | 'controlled-cabinet'
                    | 'crash-cart'
                    | 'quarantine'
                    | 'other',
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
            >
              <option value="shelf">Shelf</option>
              <option value="refrigerator">Refrigerator</option>
              <option value="controlled-cabinet">Controlled Cabinet</option>
              <option value="crash-cart">Crash Cart</option>
              <option value="quarantine">Quarantine</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Temperature Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Temperature (°C)</label>
              <Input
                type="number"
                step="0.1"
                value={locationForm.temperature_min}
                onChange={(e) => setLocationForm({ ...locationForm, temperature_min: e.target.value })}
                placeholder="e.g., 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Temperature (°C)</label>
              <Input
                type="number"
                step="0.1"
                value={locationForm.temperature_max}
                onChange={(e) => setLocationForm({ ...locationForm, temperature_max: e.target.value })}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={locationForm.description}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              placeholder="Additional details about this location..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLocationModal(false);
                setEditingLocation(null);
              }}
              disabled={savingLocation}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLocation}
              disabled={savingLocation}
              className="bg-[#0056B3] hover:bg-[#004494]"
            >
              {savingLocation ? 'Saving...' : editingLocation ? 'Update Location' : 'Add Location'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PharmacySettings;
