import { useState } from "react";
import InnovatorLayout from "../components/InnovatorLayout";
import "./Settings.css";

export default function Settings() {
  const user = { firstName: "Sarah", lastName: "Mwakasege", email: "sarah.mwakasege@gmail.com", role: "innovator" };

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "Sarah",
    lastName: user?.lastName || "Mwakasege",
    email: user?.email || "sarah.mwakasege@gmail.com",
    phone: "+255 612 345 678",
    bio: "Passionate innovator focused on sustainable technology solutions for African communities.",
    location: "Dar es Salaam, Tanzania",
  });

  const [notifications, setNotifications] = useState({
    emailApplications: true,
    emailUpdates: true,
    emailReminders: false,
    pushApplications: true,
    pushUpdates: true,
    pushReminders: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <InnovatorLayout>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
        </header>

        <div className="settings-content">
          {/* Profile Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Profile Information</h2>
              <p className="section-desc">Update your personal details and public profile</p>
            </div>
            <div className="settings-card">
              <div className="avatar-section">
                <div className="avatar-preview">
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
                <div className="avatar-info">
                  <h4>Profile Picture</h4>
                  <p>JPG, PNG, or GIF. Max 2MB</p>
                  <button className="upload-btn">Upload New</button>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="form-input form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Notification Preferences</h2>
              <p className="section-desc">Choose how you want to be notified</p>
            </div>
            <div className="settings-card">
              <div className="notification-group">
                <h4 className="notification-group-title">Email Notifications</h4>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Application Updates</span>
                    <span className="toggle-desc">Get notified when your application status changes</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailApplications}
                      onChange={(e) => setNotifications({ ...notifications, emailApplications: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Project Updates</span>
                    <span className="toggle-desc">Receive updates about your active projects</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailUpdates}
                      onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Deadline Reminders</span>
                    <span className="toggle-desc">Get reminded about upcoming deadlines</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailReminders}
                      onChange={(e) => setNotifications({ ...notifications, emailReminders: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h4 className="notification-group-title">Push Notifications</h4>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Application Updates</span>
                    <span className="toggle-desc">Receive push notifications for application changes</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.pushApplications}
                      onChange={(e) => setNotifications({ ...notifications, pushApplications: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Project Updates</span>
                    <span className="toggle-desc">Receive push notifications for project updates</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.pushUpdates}
                      onChange={(e) => setNotifications({ ...notifications, pushUpdates: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <span className="toggle-label">Deadline Reminders</span>
                    <span className="toggle-desc">Receive push notifications for deadlines</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.pushReminders}
                      onChange={(e) => setNotifications({ ...notifications, pushReminders: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Security</h2>
              <p className="section-desc">Manage your password and security settings</p>
            </div>
            <div className="settings-card">
              <div className="security-item">
                <div className="security-info">
                  <h4>Password</h4>
                  <p>Last changed 30 days ago</p>
                </div>
                <button className="security-btn">Change Password</button>
              </div>
              <div className="security-item">
                <div className="security-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button className="security-btn security-btn-outline">Enable 2FA</button>
              </div>
              <div className="security-item">
                <div className="security-info">
                  <h4>Active Sessions</h4>
                  <p>You're logged in on 2 devices</p>
                </div>
                <button className="security-btn security-btn-outline">Manage Sessions</button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="settings-actions">
            <button className="save-btn" onClick={handleSave}>
              {saved ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved Successfully
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
    </InnovatorLayout>
  );
}