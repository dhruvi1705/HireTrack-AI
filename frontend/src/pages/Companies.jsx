import { useEffect, useState } from "react";
import { Plus, Search, Building2, X, Trash2, Globe, MapPin, Edit3, ExternalLink } from "lucide-react";

import companyService from "../services/companyService";
import "./Companies.css";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    location: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await companyService.getCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error("Loading companies failed:", err);
      setError(err.response?.data?.detail || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialCompanies = async () => {
      try {
        const data = await companyService.getCompanies();
        if (!ignore) {
          setCompanies(data || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Loading companies failed:", err);
          setError(err.response?.data?.detail || "Unable to load companies.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialCompanies();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: "", website: "", location: "" });
    setModalError("");
    setShowAddModal(true);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim()) {
      setModalError("Company name is required.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        name: formData.name.trim(),
        website: formData.website.trim() || null,
        location: formData.location.trim() || null,
      };

      await companyService.createCompany(payload);
      setShowAddModal(false);
      await loadCompanies();
    } catch (err) {
      console.error("Failed to create company:", err);
      setModalError(err.response?.data?.detail || "Failed to create company.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenView = (company) => {
    setSelectedCompany(company);
    setIsEditing(false);
    setFormData({
      name: company.name || "",
      website: company.website || "",
      location: company.location || "",
    });
    setModalError("");
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setModalError("");

    if (!formData.name.trim()) {
      setModalError("Company name is required.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        name: formData.name.trim(),
        website: formData.website.trim() || null,
        location: formData.location.trim() || null,
      };

      const updated = await companyService.updateCompany(selectedCompany.id, payload);
      setSelectedCompany(updated);
      setIsEditing(false);
      await loadCompanies();
    } catch (err) {
      console.error("Failed to update company:", err);
      setModalError(err.response?.data?.detail || "Failed to update company.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company? Notice: any associated jobs will also be deleted.")) {
      return;
    }

    try {
      setDeleting(true);
      setModalError("");
      await companyService.deleteCompany(companyId);
      setSelectedCompany(null);
      await loadCompanies();
    } catch (err) {
      console.error("Failed to delete company:", err);
      setModalError(err.response?.data?.detail || "Unable to delete company.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.website?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container companies-page">
      {/* HEADER */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Organizations</span>
          <h1 className="page-title">Companies</h1>
          <p>Manage hiring organizations and partner directory.</p>
        </div>

        <button
          type="button"
          className="brutalist-button primary"
          onClick={handleOpenAdd}
        >
          <Plus size={17} />
          Add Company
        </button>
      </section>

      {/* SEARCH TOOLBAR */}
      <section className="companies-toolbar brutalist-card">
        <div className="search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search companies by name, location, website..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </section>

      {/* COMPANIES LIST */}
      <section className="companies-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <Building2 size={21} />
            <h2>Registered Companies</h2>
          </div>

          <span className="job-count">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">Loading companies...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? "No companies match your search." : "No companies available yet."}
          </div>
        ) : (
          <div className="companies-grid">
            {filteredCompanies.map((company) => (
              <div
                className="company-card"
                key={company.id}
                onClick={() => handleOpenView(company)}
                style={{ cursor: "pointer" }}
              >
                <div className="company-card-top">
                  <div className="company-logo">
                    {company.name ? company.name.charAt(0).toUpperCase() : "C"}
                  </div>
                </div>

                <h3>{company.name}</h3>

                <p className="company-location">
                  {company.location ? `📍 ${company.location}` : ""}
                </p>

                <p className="company-website">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : ""}
                </p>

                <div className="company-card-footer">
                  <button
                    type="button"
                    className="view-company-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenView(company);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADD COMPANY MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="add-application-modal brutalist-card company-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Directory</span>
                <h2>Add Company</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label htmlFor="company-name">Company Name *</label>
                <input
                  id="company-name"
                  type="text"
                  placeholder="e.g. Google, Stripe, Microsoft"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="company-location">Location</label>
                <input
                  id="company-location"
                  type="text"
                  placeholder="e.g. Mountain View, CA or Bangalore, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  maxLength={150}
                />
              </div>

              <div className="form-group">
                <label htmlFor="company-website">Website URL</label>
                <input
                  id="company-website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  maxLength={255}
                />
              </div>

              {modalError && <div className="form-error">{modalError}</div>}

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="brutalist-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="brutalist-button primary"
                  disabled={modalLoading}
                >
                  <Plus size={17} />
                  {modalLoading ? "Adding..." : "Add Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / EDIT COMPANY MODAL */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div
            className="add-application-modal brutalist-card company-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Company Profile</span>
                <h2>{isEditing ? "Edit Company" : selectedCompany.name}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedCompany(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateCompany} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label htmlFor="edit-name">Company Name *</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-location">Location</label>
                  <input
                    id="edit-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    maxLength={150}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-website">Website URL</label>
                  <input
                    id="edit-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    maxLength={255}
                  />
                </div>

                {modalError && <div className="form-error">{modalError}</div>}

                <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    className="brutalist-button"
                    onClick={() => setIsEditing(false)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="brutalist-button primary"
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="company-detail-body">
                  <div className="company-detail-meta-grid">
                    <div className="company-detail-item">
                      <span className="company-detail-label">Company ID</span>
                      <span className="company-detail-value mono">#{selectedCompany.id}</span>
                    </div>

                    <div className="company-detail-item">
                      <span className="company-detail-label">Company Name</span>
                      <span className="company-detail-value">
                        <strong>{selectedCompany.name}</strong>
                      </span>
                    </div>

                    <div className="company-detail-item">
                      <span className="company-detail-label">Location</span>
                      <span className="company-detail-value">
                        {selectedCompany.location ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={14} /> {selectedCompany.location}
                          </span>
                        ) : "—"}
                      </span>
                    </div>

                    <div className="company-detail-item">
                      <span className="company-detail-label">Website</span>
                      <span className="company-detail-value">
                        {selectedCompany.website ? (
                          <a
                            href={selectedCompany.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text)" }}
                          >
                            <Globe size={14} /> {selectedCompany.website} <ExternalLink size={12} />
                          </a>
                        ) : "—"}
                      </span>
                    </div>

                    {selectedCompany.created_at && (
                      <div className="company-detail-item company-detail-full-width">
                        <span className="company-detail-label">Registered On</span>
                        <span className="company-detail-value mono" style={{ fontSize: 13 }}>
                          {new Date(selectedCompany.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {modalError && (
                  <div className="form-error" style={{ margin: "0 24px 14px" }}>
                    {modalError}
                  </div>
                )}

                <div className="company-detail-actions">
                  <button
                    type="button"
                    className="brutalist-button danger-button"
                    onClick={() => handleDeleteCompany(selectedCompany.id)}
                    disabled={deleting}
                  >
                    <Trash2 size={16} />
                    {deleting ? "Deleting..." : "Delete Company"}
                  </button>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="brutalist-button"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="brutalist-button"
                      onClick={() => setSelectedCompany(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
