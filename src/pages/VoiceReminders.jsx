import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceReminderAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import {
  IconPhone,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
} from '../components/Icons';

export default function VoiceReminders() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [preference, setPreference] = useState({
    voiceReminderEnabled: false,
    preferredLanguage: 'ENGLISH',
    phoneNumber: '',
  });

  const fetchPreference = async () => {
    try {
      setLoading(true);
      const res = await voiceReminderAPI.getPreference();
      if (res.data) {
        setPreference({
          voiceReminderEnabled: !!res.data.voiceReminderEnabled,
          preferredLanguage: res.data.preferredLanguage || 'ENGLISH',
          phoneNumber: res.data.phoneNumber || '',
        });
      }
    } catch (err) {
      // Default to empty preference if none created yet
      console.warn('Voice preference load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreference();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreference((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggleState = async () => {
    try {
      setToggling(true);
      if (preference.voiceReminderEnabled) {
        await voiceReminderAPI.disable();
        setPreference((prev) => ({ ...prev, voiceReminderEnabled: false }));
        toast.info('Automated voice alerts disabled');
      } else {
        await voiceReminderAPI.enable();
        setPreference((prev) => ({ ...prev, voiceReminderEnabled: true }));
        toast.success('Automated voice alerts activated!');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update voice reminder status'));
    } finally {
      setToggling(false);
    }
  };

  const handleSavePreference = async (e) => {
    e.preventDefault();

    if (!preference.phoneNumber.trim()) {
      toast.error('Please specify a contact phone number for dispatch calls');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        voiceReminderEnabled: preference.voiceReminderEnabled,
        preferredLanguage: preference.preferredLanguage,
        phoneNumber: preference.phoneNumber.trim(),
      };

      const res = await voiceReminderAPI.savePreference(payload);
      if (res.data) {
        setPreference({
          voiceReminderEnabled: !!res.data.voiceReminderEnabled,
          preferredLanguage: res.data.preferredLanguage,
          phoneNumber: res.data.phoneNumber,
        });
      }
      toast.success('Voice reminder preferences saved successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save voice preferences'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading voice reminder automation preferences..." />;
  }

  return (
    <div>
      <PageHeader
        title="Voice Reminder Preferences"
        subtitle="Automated IVR phone calls for high-priority fleet maintenance and compliance deadlines"
        actions={
          <button
            onClick={() => navigate('/business/voice-calls')}
            className="btn btn-outline"
          >
            <IconPhone size={16} /> View Voice Call Logs
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Settings Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Automation Settings</h2>
              <p className="card-subtitle">Configure outbound automated phone notifications</p>
            </div>
            <div>
              <span
                className={`badge ${
                  preference.voiceReminderEnabled ? 'badge-success' : 'badge-warning'
                }`}
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
              >
                {preference.voiceReminderEnabled ? 'ACTIVE & ENABLED' : 'PAUSED'}
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSavePreference}>
              {/* Quick Enable Toggle */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                    Automated Voice Call Dispatcher
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Trigger real-time voice calls for overdue maintenance & compliance dates
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleState}
                  disabled={toggling}
                  className={`btn ${preference.voiceReminderEnabled ? 'btn-danger' : 'btn-primary'}`}
                  style={{ minWidth: '110px' }}
                >
                  {toggling
                    ? 'Updating...'
                    : preference.voiceReminderEnabled
                    ? 'Disable Calls'
                    : 'Enable Calls'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="vrPhone">
                  Fleet Manager / Driver Phone Number <span className="required">*</span>
                </label>
                <input
                  id="vrPhone"
                  name="phoneNumber"
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={preference.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Standard Indian mobile format with country code (e.g. +91)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="vrLang">
                  Preferred Speech & Prompt Language <span className="required">*</span>
                </label>
                <select
                  id="vrLang"
                  name="preferredLanguage"
                  className="form-select"
                  value={preference.preferredLanguage}
                  onChange={handleInputChange}
                  required
                >
                  <option value="ENGLISH">English (Indian Accent)</option>
                  <option value="HINDI">Hindi (हिंदी)</option>
                  <option value="TELUGU">Telugu (తెలుగు)</option>
                  <option value="TAMIL">Tamil (தமிழ்)</option>
                  <option value="KANNADA">Kannada (ಕನ್ನಡ)</option>
                  <option value="MARATHI">Marathi (मराठी)</option>
                  <option value="BENGALI">Bengali (বাংলা)</option>
                  <option value="GUJARATI">Gujarati (ગુજરાતી)</option>
                </select>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Informational & Architecture Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">How Voice Reminders Work</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <strong>Deadline Tracking</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      SmartFleet continuously audits vehicle insurance, PUC expiry, road tax dates, and service milestones.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <strong>Audio Prompt Synthesis</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Alerts are converted into natural speech in your selected language ({preference.preferredLanguage}).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <strong>Telephony Dispatch & Logging</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Call attempts and delivery reports are logged in the backend Voice Call Log for audit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="card-body" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <IconAlertTriangle size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Telephony Gateway Note:</strong> Outbound voice simulation is handled by the SmartFleet
                backend controller. Integration with carrier providers (Twilio, Exotel, or AWS Polly) is isolated from
                the frontend client for security.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

