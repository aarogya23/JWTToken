import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, requestMediaAsync, uploadFileAsset } from '../api/client';
import {
  AppButton,
  AppCard,
  AppInput,
  Avatar,
  EmptyState,
  Pill,
  Screen,
  SectionTitle,
  StatTile
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { formatDate, formatNPR } from '../utils/format';
import { ProductCard, marketplaceStyles as styles } from './MarketplaceCoreScreens';

const starterServices = [
  {
    id: 'starter-veg',
    name: 'Fresh Vegetables Supply',
    description: 'Daily and weekly vegetable supply for homes, shops, and restaurants.',
    price: 1500,
    providerName: 'Green Basket Traders',
    marketSegment: 'B2C'
  },
  {
    id: 'starter-carpentry',
    name: 'Carpentry and Furniture Repair',
    description: 'Door fitting, shelf installation, and custom wood repair jobs.',
    price: 2500,
    providerName: 'Timber Craft Works',
    marketSegment: 'B2C'
  }
];

const formFromUser = (user) => ({
  profileSource: 'personal',
  requesterType: user?.businessName ? 'BUSINESS' : 'CUSTOMER',
  marketSegment: user?.marketSegment || 'B2C',
  businessName: user?.businessName || user?.fullName || '',
  sourceOrganization: user?.businessName || user?.fullName || '',
  destinationOrganization: '',
  shipmentType: '',
  pickupLocation: user?.location || '',
  dropoffLocation: '',
  quantity: '1',
  scheduleWindow: '',
  requirements: user?.logisticsSupport || ''
});

export function ProfileScreen({ navigation }) {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    bio: '',
    location: '',
    profileImage: '',
    deliveryPerson: false,
    marketSegment: 'B2C',
    businessName: '',
    logisticsSupport: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const patch = (key, value) => setProfile((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/profile');
        setProfile({
          fullName: response.data?.fullName || '',
          bio: response.data?.bio || '',
          location: response.data?.location || '',
          profileImage: response.data?.profileImage || '',
          deliveryPerson: !!response.data?.deliveryPerson,
          marketSegment: response.data?.marketSegment || 'B2C',
          businessName: response.data?.businessName || '',
          logisticsSupport: response.data?.logisticsSupport || ''
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chooseImage = async () => {
    try {
      const asset = await requestMediaAsync(['images']);
      if (!asset) return;
      const upload = await uploadFileAsset(asset);
      if (upload?.fileUrl) patch('profileImage', upload.fileUrl);
    } catch {
      setMessage('Failed to upload image.');
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/profile', profile);
      await refreshProfile();
      setMessage('Profile updated successfully.');
    } catch {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Text style={styles.helperText}>Loading profile...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle
        eyebrow="Account"
        title="My profile"
        description="Manage your public profile, delivery enrollment, business details, and logistics notes."
      />
      <AppCard style={styles.formCard}>
        <Pressable style={{ alignItems: 'center', gap: 10 }} onPress={chooseImage}>
          <Avatar source={profile.profileImage} label={profile.fullName || user?.username} size={108} />
          <Text style={styles.linkText}>Change profile image</Text>
        </Pressable>
        {message ? (
          <Text style={message.includes('successfully') ? {
            color: colors.success,
            backgroundColor: '#e8f6ef',
            padding: 12,
            borderRadius: 12
          } : styles.error}>
            {message}
          </Text>
        ) : null}
        <AppInput label="Full name" value={profile.fullName} onChangeText={(value) => patch('fullName', value)} />
        <AppInput label="Location" value={profile.location} onChangeText={(value) => patch('location', value)} />
        <AppInput label="Market segment" value={profile.marketSegment} onChangeText={(value) => patch('marketSegment', value)} />
        <AppInput label="Business name" value={profile.businessName} onChangeText={(value) => patch('businessName', value)} />
        <AppInput label="Bio" multiline value={profile.bio} onChangeText={(value) => patch('bio', value)} />
        <AppInput label="Logistics notes" multiline value={profile.logisticsSupport} onChangeText={(value) => patch('logisticsSupport', value)} />
        <Pressable style={styles.sellerRow} onPress={() => patch('deliveryPerson', !profile.deliveryPerson)}>
          <Ionicons
            name={profile.deliveryPerson ? 'checkbox' : 'square-outline'}
            size={26}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.productTitle}>Delivery driver enrollment</Text>
            <Text style={styles.productText}>Enable this to unlock the Delivery Dashboard inside the mobile app.</Text>
          </View>
        </Pressable>
        <AppButton title="Save profile" loading={saving} onPress={save} icon="save-outline" />
        {user?.id ? (
          <AppButton title="Open my owner page" variant="outline" onPress={() => navigation.navigate('CreatorPage', { userId: user.id })} />
        ) : null}
      </AppCard>
    </Screen>
  );
}

export function ServicesScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(formFromUser(user));
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setForm(formFromUser(user));
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [servicesRes, requestsRes, retailersRes] = await Promise.all([
          api.get('/api/services/browse'),
          api.get('/api/logistics-requests/mine'),
          api.get('/api/retailers')
        ]);
        const liveServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
        setServices(
          liveServices.map((service) => ({
            ...service,
            providerName: service.user?.businessName || service.user?.fullName || 'Service provider',
            marketSegment: service.user?.marketSegment || 'B2C'
          }))
        );
        setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setRetailers(Array.isArray(retailersRes.data) ? retailersRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visibleServices = (services.length ? services : starterServices).filter((service) =>
    [service.name, service.description, service.providerName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const useService = (service) => {
    setForm((current) => ({
      ...current,
      destinationOrganization: service.providerName || '',
      shipmentType: service.name,
      requirements: `${service.name}\nProvider: ${service.providerName}\nNeed details: `
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/logistics-requests', {
        ...form,
        quantity: Number(form.quantity || 1)
      });
      const requestsRes = await api.get('/api/logistics-requests/mine');
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setForm(formFromUser(user));
    } catch {
      Alert.alert('Request failed', 'Could not send service requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <SectionTitle
        eyebrow="Service marketplace"
        title="Search services and send needs directly"
        description="The Expo version keeps the web flow: discover providers, choose a destination organization, and submit your requirement."
      />
      <AppInput
        label="Search services"
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Vegetables, carpentry, transport, electrician..."
      />

      <FlatRetailerPills retailers={retailers} onPick={(name) => patch('destinationOrganization', name)} />

      {loading ? (
        <Text style={styles.helperText}>Loading services...</Text>
      ) : visibleServices.length === 0 ? (
        <EmptyState title="No services found" description="Use the form below to send a direct requirement anyway." />
      ) : (
        visibleServices.map((service) => (
          <AppCard key={service.id} style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.productTitle}>{service.name}</Text>
                <Text style={styles.productText}>{service.description}</Text>
              </View>
              <Pill tone="primary">{service.marketSegment || 'B2C'}</Pill>
            </View>
            <Text style={styles.price}>{formatNPR(service.price || 0)}</Text>
            <Text style={styles.productText}>{service.providerName}</Text>
            <AppButton title="Use this service" variant="outline" onPress={() => useService(service)} />
          </AppCard>
        ))
      )}

      <AppCard style={styles.formCard}>
        <Text style={styles.productTitle}>Send organization requirement</Text>
        <AppInput label="From organization" value={form.sourceOrganization} onChangeText={(value) => patch('sourceOrganization', value)} />
        <AppInput label="To organization" value={form.destinationOrganization} onChangeText={(value) => patch('destinationOrganization', value)} />
        <AppInput label="Service / product needed" value={form.shipmentType} onChangeText={(value) => patch('shipmentType', value)} />
        <AppInput label="Pickup / source location" value={form.pickupLocation} onChangeText={(value) => patch('pickupLocation', value)} />
        <AppInput label="Delivery / destination location" value={form.dropoffLocation} onChangeText={(value) => patch('dropoffLocation', value)} />
        <AppInput label="Quantity" keyboardType="numeric" value={form.quantity} onChangeText={(value) => patch('quantity', value)} />
        <AppInput label="Schedule window" value={form.scheduleWindow} onChangeText={(value) => patch('scheduleWindow', value)} />
        <AppInput label="Requirement details" multiline value={form.requirements} onChangeText={(value) => patch('requirements', value)} />
        <AppButton title="Send need directly" onPress={submit} loading={submitting} icon="send-outline" />
      </AppCard>

      <SectionTitle eyebrow="My submitted needs" title="Submitted requests" />
      {requests.length === 0 ? (
        <EmptyState title="No submitted needs yet" description="Search a service or send your first requirement above." />
      ) : (
        requests.map((request) => (
          <AppCard key={request.id}>
            <View style={styles.inlineWrap}>
              <Pill tone="primary">{request.marketSegment}</Pill>
              <Pill>{request.requesterType}</Pill>
              <Pill>{request.status}</Pill>
            </View>
            <Text style={styles.productTitle}>{request.shipmentType}</Text>
            <Text style={styles.productText}>{request.businessName}</Text>
            <Text style={styles.productText}>From: {request.pickupLocation}</Text>
            <Text style={styles.productText}>To: {request.dropoffLocation}</Text>
            {request.requirements ? <Text style={styles.productText}>{request.requirements}</Text> : null}
          </AppCard>
        ))
      )}
    </Screen>
  );
}

function FlatRetailerPills({ retailers, onPick }) {
  if (!retailers.length) return null;
  return (
    <View style={styles.inlineWrap}>
      {retailers.slice(0, 8).map((item) => (
        <Pressable
          key={item.id}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: colors.border
          }}
          onPress={() => onPick(item.businessName || item.fullName || '')}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>{item.businessName || item.fullName}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function RetailInventoryScreen() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/products');
        const products = Array.isArray(response.data) ? response.data : [];
        const grouped = new Map();
        products.forEach((product) => {
          const key = product.category || 'General';
          const entry = grouped.get(key) || { category: key, totalStock: 0, itemCount: 0, totalValue: 0 };
          entry.totalStock += Number(product.stockQuantity || 0);
          entry.itemCount += 1;
          entry.totalValue += Number(product.stockQuantity || 0) * Number(product.price || 0);
          grouped.set(key, entry);
        });
        setSummary([...grouped.values()]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Screen>
      <SectionTitle
        eyebrow="Retail inventory"
        title="Inventory management"
        description="Track stock by category, just like the web inventory summary page."
      />
      {loading ? (
        <Text style={styles.helperText}>Loading inventory...</Text>
      ) : summary.length === 0 ? (
        <EmptyState title="No stock added yet" description="Create products with stock quantity to see inventory here." />
      ) : (
        summary.map((entry) => (
          <AppCard key={entry.category}>
            <Text style={styles.productTitle}>{entry.category}</Text>
            <View style={styles.inlineWrap}>
              <StatTile label="Items" value={String(entry.itemCount)} />
              <StatTile label="Units" value={String(entry.totalStock)} />
              <StatTile label="Value" value={formatNPR(entry.totalValue)} />
            </View>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

export function CreatorPageScreen({ route, navigation }) {
  const { user } = useAuth();
  const { userId } = route.params;
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postForm, setPostForm] = useState({ title: '', content: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);

  const isOwner = Number(user?.id) === Number(userId);

  const load = async () => {
    try {
      const response = await api.get(`/api/creator-pages/${userId}`);
      setPageData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const chooseImage = async () => {
    try {
      const asset = await requestMediaAsync(['images']);
      if (!asset) return;
      const upload = await uploadFileAsset(asset);
      setPostForm((current) => ({ ...current, imageUrl: upload?.fileUrl || '' }));
    } catch {
      Alert.alert('Upload failed', 'Could not upload post image.');
    }
  };

  const publish = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      Alert.alert('Missing fields', 'Post title and content are required.');
      return;
    }
    try {
      setSaving(true);
      const response = await api.post(`/api/creator-pages/${userId}/posts`, postForm);
      setPageData((current) => ({ ...current, posts: [response.data, ...(current?.posts || [])] }));
      setPostForm({ title: '', content: '', imageUrl: '' });
    } catch {
      Alert.alert('Publish failed', 'Could not publish the post.');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/api/creator-pages/${userId}/posts/${postId}`);
      setPageData((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== postId) }));
    } catch {
      Alert.alert('Delete failed', 'Could not delete the post.');
    }
  };

  if (loading) {
    return (
      <Screen>
        <Text style={styles.helperText}>Loading creator page...</Text>
      </Screen>
    );
  }

  if (!pageData) {
    return (
      <Screen>
        <EmptyState title="Page not found" description="The owner page could not be loaded." />
      </Screen>
    );
  }

  const products = pageData.products || [];

  return (
    <Screen>
      <AppCard>
        <View style={styles.profileRow}>
          <Avatar source={pageData.profileImage} label={pageData.fullName || pageData.businessName} size={72} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.inlineWrap}>
              <Pill tone="primary">{pageData.marketSegment || 'B2C'}</Pill>
              <Pill>Owner page</Pill>
            </View>
            <Text style={styles.detailTitle}>{pageData.fullName || pageData.businessName || 'Creator'}</Text>
            <Text style={styles.productText}>{pageData.bio || 'No public intro yet.'}</Text>
            {pageData.location ? <Text style={styles.productText}>{pageData.location}</Text> : null}
          </View>
        </View>
        <View style={styles.inlineWrap}>
          <StatTile label="Listings" value={String(products.length)} />
          <StatTile label="Categories" value={String(new Set(products.map((item) => item.category || 'General')).size)} />
          <StatTile label="Live value" value={formatNPR(products.reduce((sum, item) => sum + Number(item.price || 0), 0))} />
        </View>
      </AppCard>

      {isOwner ? (
        <AppCard style={styles.formCard}>
          <Text style={styles.productTitle}>Post on your page</Text>
          <AppInput label="Post title" value={postForm.title} onChangeText={(value) => setPostForm((current) => ({ ...current, title: value }))} />
          <AppInput label="Content" multiline value={postForm.content} onChangeText={(value) => setPostForm((current) => ({ ...current, content: value }))} />
          {postForm.imageUrl ? <Image source={{ uri: postForm.imageUrl }} style={styles.detailImage} /> : null}
          <View style={styles.rowActions}>
            <AppButton title="Add image" variant="outline" onPress={chooseImage} />
            <AppButton title="Publish" onPress={publish} loading={saving} />
          </View>
        </AppCard>
      ) : null}

      <SectionTitle eyebrow="Posts & updates" title="Creator posts" />
      {(pageData.posts || []).length === 0 ? (
        <EmptyState title="No posts yet" description={isOwner ? 'Use the composer above to publish your first update.' : 'This owner has not posted updates yet.'} />
      ) : (
        pageData.posts.map((post) => (
          <AppCard key={post.id} style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>{post.title}</Text>
                <Text style={styles.productText}>{formatDate(post.createdAt)}</Text>
              </View>
              {isOwner ? (
                <Pressable onPress={() => deletePost(post.id)}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.productText}>{post.content}</Text>
            {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.detailImage} /> : null}
          </AppCard>
        ))
      )}

      <SectionTitle eyebrow="Listings" title="What they offer" />
      {products.length === 0 ? (
        <EmptyState title="No active listings right now" description="Check back again later." />
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate('ProductDetails', { id: product.id })}
          />
        ))
      )}
    </Screen>
  );
}
