import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { vehicleAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconCar,
  IconTruck,
  IconPlus,
  IconSearch,
  IconEye,
  IconTool,
  IconShield,
} from '../components/Icons';

export default function Vehicles() {
  const { mode } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleName: '',
    vehicleType: 'Car',
    brand: '',
    model: '',
    registrationNumber: '',
    fuelType: 'Diesel',
    currentKm: '',
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleAPI.getAll();
      setVehicles(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch vehicles'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        vehicleName: formData.vehicleName.trim(),
        vehicleType: formData.vehicleType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        fuelType: formData.fuelType,
        currentKm: formData.currentKm ? Number(formData.currentKm) : 0,
      };

      await vehicleAPI.create(payload);
      toast.success('Vehicle added successfully!');
      setIsAddModalOpen(false);
      setFormData({
        vehicleName: '',
        vehicleType: 'Car',
        brand: '',
        model: '',
        registrationNumber: '',
        fuelType: 'Diesel',
        currentKm: '',
      });
      fetchVehicles();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add vehicle'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchName = v.vehicleName?.toLowerCase().includes(term);
    const matchReg = v.registrationNumber?.toLowerCase().includes(term);
    const matchBrand = v.brand?.toLowerCase().includes(term);
    const matchType = filterType === 'ALL' || v.vehicleType === filterType;
    return (matchName || matchReg || matchBrand) && matchType;
  });

  const isBusiness = mode === 'business';
  const pageTitle = isBusiness ? 'Fleet Management' : 'My Vehicles';
  const pageSubtitle = isBusiness
    ? 'Manage commercial trucks, buses, taxis, and contract fleet units'
    : 'Track personal family cars, two-wheelers, and daily drivers';

  const viewDetails = (vId) => {
    const basePath = isBusiness ? '/business' : '/personal';
    navigate(`${basePath}/vehicles/${vId}`);
  };

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <IconPlus size={16} />
            <span>Add Vehicle</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="search-bar-wrap">
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, brand, or registration #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)',
            }}
          >
            <IconSearch size={16} />
          </span>
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Vehicle Types</option>
          <option value="Car">Car</option>
          <option value="Bike">Bike / Two-Wheeler</option>
          <option value="SUV">SUV</option>
          <option value="Truck">Truck</option>
          <option value="Bus">Bus</option>
          <option value="Van">Van / LCV</option>
          <option value="Auto">Auto / Three-Wheeler</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {loading ? (
        <Loader text="Loading fleet records..." />
      ) : filteredVehicles.length === 0 ? (
        <div className="sf-card">
          <EmptyState
            title={searchTerm ? 'No matching vehicles found' : 'No vehicles added yet'}
            description={
              searchTerm
                ? 'Try adjusting your search terms or filter selection.'
                : 'Click the button below to register your first vehicle into SmartFleet.'
            }
            actionLabel="Add Vehicle"
            onAction={() => setIsAddModalOpen(true)}
            icon={isBusiness ? IconTruck : IconCar}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredVehicles.map((v) => (
            <div key={v.id} className="sf-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="sf-card-header">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {v.vehicleName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {v.brand} {v.model}
                  </div>
                </div>
                <span className="badge badge-primary">{v.registrationNumber}</span>
              </div>

              <div className="sf-card-body" style={{ flex: 1, padding: '16px 24px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Type
                    </span>
                    <strong>{v.vehicleType || 'Vehicle'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Fuel
                    </span>
                    <strong>{v.fuelType || 'Petrol'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Odometer
                    </span>
                    <strong>{Number(v.currentKm || 0).toLocaleString()} km</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Status
                    </span>
                    <span className="badge badge-success">ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="sf-card-footer" style={{ justifyContent: 'space-between' }}>
                <button
                  onClick={() => viewDetails(v.id)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  <IconEye size={15} />
                  <span>View Details & History</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isBusiness ? 'Register Commercial Vehicle' : 'Add Personal Vehicle'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-vehicle-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add Vehicle'}
            </button>
          </>
        }
      >
        <form id="add-vehicle-form" onSubmit={handleAddVehicle}>
          <div className="form-group">
            <label className="form-label" htmlFor="vehicleName">
              Vehicle Nickname / Name <span className="required">*</span>
            </label>
            <input
              id="vehicleName"
              name="vehicleName"
              type="text"
              className="form-control"
              placeholder={isBusiness ? 'e.g. Heavy Hauler - 01' : 'e.g. Daily Honda City'}
              value={formData.vehicleName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="vehicleType">
                Vehicle Type <span className="required">*</span>
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                className="form-select"
                value={formData.vehicleType}
                onChange={handleInputChange}
                required
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike / Two-Wheeler</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Van">Van / LCV</option>
                <option value="Auto">Auto Rickshaw</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fuelType">
                Fuel Type <span className="required">*</span>
              </label>
              <select
                id="fuelType"
                name="fuelType"
                className="form-select"
                value={formData.fuelType}
                onChange={handleInputChange}
                required
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="EV">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="brand">
                Make / Brand <span className="required">*</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                className="form-control"
                placeholder="e.g. Tata, Mahindra, Maruti"
                value={formData.brand}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="model">
                Model <span className="required">*</span>
              </label>
              <input
                id="model"
                name="model"
                type="text"
                className="form-control"
                placeholder="e.g. Nexon EV, 407 LPT, Swift"
                value={formData.model}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="registrationNumber">
                Registration Number <span className="required">*</span>
              </label>
              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                className="form-control"
                placeholder="e.g. TS09FA1234"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currentKm">
                Current Odometer (KM) <span className="required">*</span>
              </label>
              <input
                id="currentKm"
                name="currentKm"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 24500"
                value={formData.currentKm}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

