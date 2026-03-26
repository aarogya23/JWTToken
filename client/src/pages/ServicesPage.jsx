import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Search,
  Send,
  ShoppingBasket,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { formatNPR } from '../utils/currency';
import './Products.css';

const starterServices = [
  {
    id: 'starter-vegetables',
    name: 'Fresh Vegetables Supply',
    description: 'Daily and weekly vegetable supply for homes, shops, and restaurants.',
    price: 1500,
    providerName: 'Green Basket Traders',
    marketSegment: 'B2C',
    serviceType: 'Vegetables',
    logisticsSupport: 'Morning delivery inside city routes and bulk crate handling.',
  },
  {
    id: 'starter-carpentry',
    name: 'Carpentry and Furniture Repair',
    description: 'Door fitting, shelf installation, and custom wood repair jobs.',
    price: 2500,
    providerName: 'Timber Craft Works',
    marketSegment: 'B2C',
    serviceType: 'Carpentry',
    logisticsSupport: 'On-site visit with tools and pickup/drop for workshop repair.',
  },
  {
    id: 'starter-goat',
    name: 'Fresh Goat Meat Supply',
    description: 'Fresh goat delivery for households, events, and business kitchens.',
    price: 3200,
    providerName: 'Fresh Goat Hub',
    marketSegment: 'B2B',
    serviceType: 'Fresh Goat',
    logisticsSupport: 'Cold-chain transport and scheduled dispatch for bulk orders.',
  },
];

const quickTags = ['Vegetables', 'Carpentry', 'Fresh Goat', 'Electrician', 'Catering', 'Transport'];

const buildProfileOptions = (user) => {
  const options = [];

  if (user?.fullName || user?.email) {
    options.push({
      id: 'personal',
      label: `Customer profile${user?.fullName ? ` · ${user.fullName}` : ''}`,
      requesterType: 'CUSTOMER',
      marketSegment: 'B2C',
      businessName: user?.fullName || user?.email || 'Customer',
    });
  }

  if (user?.businessName || user?.marketSegment === 'B2B') {
    options.push({
      id: 'business',
      label: `Business profile${user?.businessName ? ` · ${user.businessName}` : ''}`,
      requesterType: 'BUSINESS',
      marketSegment: user?.marketSegment || 'B2B',
      businessName: user?.businessName || user?.fullName || 'Business',
    });
  }

  return options.length > 0
    ? options
    : [
        {
          id: 'personal',
          label: 'Customer profile',
          requesterType: 'CUSTOMER',
          marketSegment: 'B2C',
          businessName: user?.fullName || 'Customer',
        },
      ];
};

const initialForm = (user, requestedService = '', profileOptions = buildProfileOptions(user)) => ({
  profileSource: profileOptions[0]?.id || 'personal',
  requesterType: profileOptions[0]?.requesterType || 'CUSTOMER',
  marketSegment: profileOptions[0]?.marketSegment || 'B2C',
  businessName: profileOptions[0]?.businessName || user?.fullName || '',
  sourceOrganization: profileOptions[0]?.businessName || user?.fullName || '',
  destinationOrganization: '',
  shipmentType: requestedService || 'Service Requirement',
  pickupLocation: user?.location || '',
  dropoffLocation: '',
  quantity: 1,
  scheduleWindow: '',
  requirements: requestedService
    ? `Need service for: ${requestedService}`
    : user?.logisticsSupport || '',
});

export default function ServicesPage() {
  const { user } = useAuth();
  const profileOptions = useMemo(() => buildProfileOptions(user), [user]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm(user, '', profileOptions));

  useEffect(() => {
    setForm(initialForm(user, form.shipmentType === 'Service Requirement' ? '' : form.shipmentType, profileOptions));
  }, [user, profileOptions]);

  useEffect(() => {
    loadServices();
    loadRequests();
  }, []);

  const updateOrganizations = (mappedLiveServices, retailerDirectory = []) => {
    const orgSet = new Set();
    profileOptions.forEach((option) => {
      if (option.businessName) orgSet.add(option.businessName);
    });
    retailerDirectory.forEach((retailer) => {
      if (retailer.businessName) orgSet.add(retailer.businessName);
      else if (retailer.fullName) orgSet.add(retailer.fullName);
    });
    mappedLiveServices.forEach((service) => {
      if (service.providerName) orgSet.add(service.providerName);
    });
    starterServices.forEach((service) => {
      if (service.providerName) orgSet.add(service.providerName);
    });
    setOrganizations(Array.from(orgSet).filter(Boolean));
  };

  const loadServices = async () => {
    try {
      const [servicesRes, retailersRes] = await Promise.all([
        api.get('/api/services/browse'),
        api.get('/api/retailers'),
      ]);
      const retailerDirectory = Array.isArray(retailersRes.data) ? retailersRes.data : [];
      setRetailers(retailerDirectory);
      const liveServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const mappedLive = liveServices.map((service) => ({
        ...service,
        providerName: service.user?.businessName || service.user?.fullName || 'Service provider',
        marketSegment: service.user?.marketSegment || 'B2C',
        serviceType: service.name,
        logisticsSupport:
          service.user?.logisticsSupport || 'Provider will coordinate delivery or on-site support.',
      }));
      setServices(mappedLive);
      updateOrganizations(mappedLive, retailerDirectory);
    } catch {
      setServices([]);
      setRetailers([]);
      updateOrganizations([], []);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await api.get('/api/logistics-requests/mine');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const visibleServices = useMemo(() => {
    const merged = services.length > 0 ? services : starterServices;
    const query = searchTerm.trim().toLowerCase();

    return merged.filter((service) => {
      const matchesTag =
        activeTag === 'All' ||
        service.name?.toLowerCase().includes(activeTag.toLowerCase()) ||
        service.serviceType?.toLowerCase().includes(activeTag.toLowerCase()) ||
        service.description?.toLowerCase().includes(activeTag.toLowerCase());

      const matchesQuery =
        !query ||
        service.name?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.providerName?.toLowerCase().includes(query) ||
        service.serviceType?.toLowerCase().includes(query);

      return matchesTag && matchesQuery;
    });
  }, [services, searchTerm, activeTag]);

  const submitNeed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/api/logistics-requests', {
        ...form,
        quantity: Number(form.quantity || 1),
      });
      setSuccess('Your organization-to-organization request was sent successfully.');
      setForm(initialForm(user, searchTerm, profileOptions));
      loadRequests();
    } catch {
      setError('Failed to send service requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'profileSource') {
      const selectedProfile = profileOptions.find((option) => option.id === value);
      if (!selectedProfile) return;
      setForm((prev) => ({
        ...prev,
        profileSource: selectedProfile.id,
        requesterType: selectedProfile.requesterType,
        marketSegment: selectedProfile.marketSegment,
        businessName: selectedProfile.businessName,
        sourceOrganization: selectedProfile.businessName,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const useServiceAsNeed = (service) => {
    const baseForm = initialForm(user, service.name, profileOptions);
    setForm({
      ...baseForm,
      marketSegment: service.marketSegment || baseForm.marketSegment || 'B2C',
      destinationOrganization: service.providerName || '',
      requirements: `${service.name}\nProvider: ${service.providerName}\nNeed details: `,
    });
  };

  const chooseRetailer = (retailer) => {
    const retailerName = retailer.businessName || retailer.fullName || '';
    setForm((prev) => ({
      ...prev,
      destinationOrganization: retailerName,
      marketSegment: retailer.marketSegment || prev.marketSegment,
      requirements: `${prev.shipmentType}\nTarget retailer: ${retailerName}\nNeed details: `,
    }));
  };

  return (
    <div className="inventory-page">
      <section className="inventory-hero">
        <div>
          <span className="social-pill">
            <Sparkles size={14} /> Service marketplace
          </span>
          <h1>Search services and send needs directly</h1>
          <p>
            Choose a source organization, search a destination company, and send the requirement directly
            from ABC to XYZ without manually typing everything.
          </p>
        </div>
      </section>

      <div className="services-layout services-layout--market">
        <section className="social-panel services-market-panel">
          <div className="social-panel-head">
            <h3>Discover Services</h3>
          </div>

          <div className="services-market-toolbar">
            <div className="social-search-input-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-input search-input social-search-input"
                placeholder="Search vegetables, carpentry, fresh goat, catering..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="services-tag-row">
              <button
                type="button"
                className={`services-tag ${activeTag === 'All' ? 'active' : ''}`}
                onClick={() => setActiveTag('All')}
              >
                All
              </button>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`services-tag ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="services-retailer-strip">
            {retailers.slice(0, 8).map((retailer) => {
              const retailerName = retailer.businessName || retailer.fullName;
              return (
                <button
                  key={retailer.id}
                  type="button"
                  className="services-retailer-pill"
                  onClick={() => chooseRetailer(retailer)}
                >
                  {retailerName}
                </button>
              );
            })}
          </div>

          <div className="services-market-grid">
            {loading ? (
              <p className="text-muted">Loading services...</p>
            ) : visibleServices.length === 0 ? (
              <div className="empty-state social-empty-state">
                <BriefcaseBusiness size={44} className="text-muted mb-4" />
                <h3>No services found</h3>
                <p className="text-muted">Use the form to send exactly what your organization needs.</p>
              </div>
            ) : (
              visibleServices.map((service) => (
                <article key={service.id} className="services-market-card">
                  <div className="inventory-card-topline">
                    <span className="inventory-badge active">{service.marketSegment || 'B2C'}</span>
                    <span className="inventory-moq">{service.providerName}</span>
                  </div>
                  <div className="services-market-title">
                    {service.serviceType?.toLowerCase().includes('vegetable') ? (
                      <ShoppingBasket size={18} />
                    ) : (
                      <Wrench size={18} />
                    )}
                    <h3>{service.name}</h3>
                  </div>
                  <p className="product-desc">{service.description}</p>
                  <p className="inventory-price">{formatNPR(service.price || 0)}</p>
                  <p className="inventory-logistics">Support: {service.logisticsSupport}</p>
                  <button
                    type="button"
                    className="btn btn-outline inventory-btn"
                    onClick={() => useServiceAsNeed(service)}
                  >
                    Use This Service
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="social-panel services-form-panel">
          <div className="social-panel-head">
            <h3>Send Organization Requirement</h3>
          </div>
          <form className="services-form" onSubmit={submitNeed}>
            {error ? <div className="auth-error">{error}</div> : null}
            {success ? <div className="services-success">{success}</div> : null}

            <div className="form-group">
              <label className="form-label" htmlFor="profileSource">Send As</label>
              <select id="profileSource" className="form-input" value={form.profileSource} onChange={handleChange}>
                {profileOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="services-profile-badge">
              {form.requesterType === 'BUSINESS' ? <Building2 size={16} /> : <CircleUserRound size={16} />}
              <span>
                {form.requesterType} · {form.marketSegment} · {form.businessName}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sourceOrganization">From Organization</label>
              <input
                id="sourceOrganization"
                className="form-input"
                value={form.sourceOrganization}
                onChange={handleChange}
                list="organization-options"
                placeholder="Select or search source organization"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="destinationOrganization">To Organization</label>
              <input
                id="destinationOrganization"
                className="form-input"
                value={form.destinationOrganization}
                onChange={handleChange}
                list="organization-options"
                placeholder="Select or search destination organization"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="shipmentType">Service / Product Needed</label>
              <input
                id="shipmentType"
                className="form-input"
                value={form.shipmentType}
                onChange={handleChange}
                placeholder="Vegetables, carpentry, fresh goat, electrician..."
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pickupLocation">Pickup / Source Location</label>
              <input id="pickupLocation" className="form-input" value={form.pickupLocation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dropoffLocation">Delivery / Destination Location</label>
              <input id="dropoffLocation" className="form-input" value={form.dropoffLocation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">Quantity / Order Size</label>
              <input id="quantity" type="number" min="1" className="form-input" value={form.quantity} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="scheduleWindow">Schedule Window</label>
              <input id="scheduleWindow" className="form-input" value={form.scheduleWindow} onChange={handleChange} placeholder="Today evening, weekly, urgent, festival order..." />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="requirements">Requirement Details</label>
              <textarea
                id="requirements"
                className="form-input"
                rows="5"
                value={form.requirements}
                onChange={handleChange}
                placeholder="State the exact requirement, quantity, handling details, freshness, on-site work, timeline, etc."
              />
            </div>

            <datalist id="organization-options">
              {organizations.map((organization) => (
                <option key={organization} value={organization} />
              ))}
            </datalist>

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Sending...' : 'Send Need Directly'}
            </button>
          </form>
        </section>
      </div>

      <section className="social-panel services-list-panel">
        <div className="social-panel-head">
          <h3>My Submitted Needs</h3>
        </div>
        <div className="services-list services-list--wide">
          {requestsLoading ? (
            <p className="text-muted">Loading submitted needs...</p>
          ) : requests.length === 0 ? (
            <div className="empty-state social-empty-state">
              <Truck size={44} className="text-muted mb-4" />
              <h3>No submitted needs yet</h3>
              <p className="text-muted">Search a service or send your first organization-to-organization need above.</p>
            </div>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="services-request-card">
                <div className="inventory-card-topline">
                  <span className="inventory-badge active">{request.marketSegment}</span>
                  <span className="inventory-moq">{request.requesterType}</span>
                </div>
                <h3>{request.shipmentType}</h3>
                <p className="product-desc">{request.businessName}</p>
                {request.sourceOrganization ? (
                  <p className="inventory-logistics">From org: {request.sourceOrganization}</p>
                ) : null}
                {request.destinationOrganization ? (
                  <p className="inventory-logistics">To org: {request.destinationOrganization}</p>
                ) : null}
                <p className="inventory-logistics">From: {request.pickupLocation}</p>
                <p className="inventory-logistics">To: {request.dropoffLocation}</p>
                <p className="inventory-logistics">Quantity: {request.quantity || 1}</p>
                {request.scheduleWindow ? (
                  <p className="inventory-logistics">Schedule: {request.scheduleWindow}</p>
                ) : null}
                {request.requirements ? (
                  <p className="inventory-description">{request.requirements}</p>
                ) : null}
                <div className="inventory-status-row">
                  <span>Status: {request.status}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
