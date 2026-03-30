import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, requestMediaAsync, uploadFileAsset } from '../api/client';
import StoryStrip from '../components/StoryStrip';
import {
  AppButton,
  AppCard,
  AppInput,
  Avatar,
  EmptyState,
  GradientHero,
  Pill,
  Screen,
  SectionTitle,
  StatTile
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';
import { formatDate, formatNPR } from '../utils/format';

const initialProductForm = {
  name: '',
  description: '',
  price: '',
  category: 'Clothing',
  stockQuantity: '0',
  imageUrl: '',
  targetMarket: 'B2C',
  minimumOrderQuantity: '1',
  logisticsSupport: ''
};

export const ProductCard = ({ product, onPress, actionLabel = 'View details' }) => (
  <Pressable onPress={onPress}>
    <AppCard style={styles.productCard}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productPlaceholder]}>
          <Ionicons name="pricetag-outline" size={34} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.productBody}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productText} numberOfLines={2}>
              {product.description || 'No description yet.'}
            </Text>
          </View>
          <Text style={styles.price}>{formatNPR(product.price || 0)}</Text>
        </View>
        <View style={styles.inlineWrap}>
          <Pill>{product.category || 'General'}</Pill>
          <Pill tone="primary">{product.targetMarket || 'B2C'}</Pill>
          <Pill>MOQ {product.minimumOrderQuantity || 1}</Pill>
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.sellerLine}>
            <Avatar source={product.user?.profileImage} label={product.user?.fullName} size={30} />
            <Text style={styles.productText}>{product.user?.fullName || 'Unknown seller'}</Text>
          </View>
          <Text style={styles.linkText}>{actionLabel}</Text>
        </View>
      </View>
    </AppCard>
  </Pressable>
);

export function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/products/browse');
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return products.filter((product) =>
      [product.name, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, searchTerm]);

  const sellers = useMemo(() => {
    const map = new Map();
    filtered.forEach((product) => {
      const seller = product.user?.fullName || 'Seller';
      if (!map.has(seller)) {
        map.set(seller, {
          id: product.user?.id,
          name: seller,
          profileImage: product.user?.profileImage || ''
        });
      }
    });
    return [...map.values()].slice(0, 5);
  }, [filtered]);

  const averagePrice = filtered.length
    ? filtered.reduce((sum, item) => sum + Number(item.price || 0), 0) / filtered.length
    : 0;

  return (
    <Screen>
      <GradientHero
        title="Your network is now your storefront."
        description="Stories, trending listings, services, orders, and seller activity now live inside a mobile-first marketplace feed."
        actions={
          <>
            <AppButton title="Post an item" icon="add-circle-outline" onPress={() => navigation.navigate('CreateProduct')} />
            <AppButton title="My listings" variant="outline" icon="cube-outline" onPress={() => navigation.navigate('MyProducts')} />
          </>
        }
      />

      <AppCard>
        <View style={styles.profileRow}>
          <Avatar source={user?.profileImage} label={user?.fullName || user?.username} size={58} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.productTitle}>{user?.fullName || user?.username || 'Creator'}</Text>
            <Text style={styles.productText}>{user?.email || 'community@jwttoken.app'}</Text>
            <Text style={styles.productText}>
              {user?.marketSegment || 'B2C'}
              {user?.businessName ? ` · ${user.businessName}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.inlineWrap}>
          <StatTile label="Listings" value={String(products.length)} />
          <StatTile label="Sellers" value={String(sellers.length)} />
          <StatTile label="Avg price" value={formatNPR(averagePrice)} />
        </View>
        <View style={styles.rowActions}>
          <AppButton title="Orders" variant="outline" onPress={() => navigation.navigate('MyOrders')} />
          <AppButton title="Inventory" variant="outline" onPress={() => navigation.navigate('RetailInventory')} />
        </View>
        <View style={styles.rowActions}>
          <AppButton title="Groups" variant="outline" onPress={() => navigation.navigate('Groups')} />
          {user?.deliveryPerson ? (
            <AppButton title="Deliveries" variant="outline" onPress={() => navigation.navigate('DeliveryDashboard')} />
          ) : null}
        </View>
      </AppCard>

      <AppInput
        label="Search marketplace"
        placeholder="Search listings, sellers, or keywords..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <StoryStrip />

      <SectionTitle
        eyebrow="Featured feed"
        title="Trending listings"
        description="The mobile feed keeps the same social-commerce feel as the web dashboard."
      />

      {loading ? (
        <Text style={styles.helperText}>Loading dashboard...</Text>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bag-handle-outline"
          title="No products found"
          description="Try another keyword or publish the first item in your feed."
        />
      ) : (
        filtered.slice(0, 6).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate('ProductDetails', { id: product.id })}
          />
        ))
      )}

      <SectionTitle eyebrow="Seller pulse" title="Trending sellers" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={sellers}
        keyExtractor={(item) => String(item.id || item.name)}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('CreatorPage', { userId: item.id })}>
            <AppCard style={styles.sellerCard}>
              <Avatar source={item.profileImage} label={item.name} size={52} />
              <Text style={styles.productTitle}>{item.name}</Text>
              <Text style={styles.productText}>Open owner page</Text>
            </AppCard>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export function CreateProductScreen({ navigation }) {
  const [form, setForm] = useState(initialProductForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const chooseImage = async () => {
    try {
      setUploading(true);
      const asset = await requestMediaAsync(['images']);
      if (!asset) return;
      const upload = await uploadFileAsset(asset);
      if (upload?.fileUrl) patch('imageUrl', upload.fileUrl);
    } catch {
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/products', {
        ...form,
        price: parseFloat(form.price || '0'),
        stockQuantity: parseInt(form.stockQuantity || '0', 10),
        minimumOrderQuantity:
          form.targetMarket === 'B2B'
            ? parseInt(form.minimumOrderQuantity || '1', 10)
            : 1
      });
      navigation.goBack();
    } catch {
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <SectionTitle
        eyebrow="Seller studio"
        title="List a new product"
        description="The Expo form keeps the same web fields: pricing, stock, target market, MOQ, and logistics notes."
      />
      <AppCard style={styles.formCard}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={chooseImage} style={styles.uploadBox}>
          {form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.uploadPreview} />
          ) : (
            <>
              <Ionicons name="image-outline" size={38} color={colors.textMuted} />
              <Text style={styles.productText}>{uploading ? 'Uploading...' : 'Tap to upload product image'}</Text>
            </>
          )}
        </Pressable>
        <AppInput label="Product title" value={form.name} onChangeText={(value) => patch('name', value)} />
        <AppInput label="Price (NPR)" keyboardType="numeric" value={form.price} onChangeText={(value) => patch('price', value)} />
        <AppInput label="Category" value={form.category} onChangeText={(value) => patch('category', value)} />
        <AppInput label="Stock quantity" keyboardType="numeric" value={form.stockQuantity} onChangeText={(value) => patch('stockQuantity', value)} />
        <AppInput label="Description" multiline value={form.description} onChangeText={(value) => patch('description', value)} />
        <AppInput label="Target market" value={form.targetMarket} onChangeText={(value) => patch('targetMarket', value)} />
        <AppInput label="Minimum order quantity" keyboardType="numeric" value={form.minimumOrderQuantity} onChangeText={(value) => patch('minimumOrderQuantity', value)} />
        <AppInput label="Logistics / fulfillment details" multiline value={form.logisticsSupport} onChangeText={(value) => patch('logisticsSupport', value)} />
        <AppButton title="List Product" onPress={submit} loading={loading} icon="checkmark-circle-outline" />
      </AppCard>
    </Screen>
  );
}

export function ProductDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { id } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setProduct(response.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBuy = () =>
    Alert.alert(
      'Confirm purchase',
      'Do you want to confirm this Cash on Delivery purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy now',
          onPress: async () => {
            try {
              setBuying(true);
              await api.post(`/api/orders/${id}`);
              navigation.navigate('MyOrders');
            } catch (error) {
              Alert.alert('Purchase failed', error.response?.data?.message || 'Could not place order.');
            } finally {
              setBuying(false);
            }
          }
        }
      ]
    );

  if (loading) {
    return (
      <Screen>
        <Text style={styles.helperText}>Loading details...</Text>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <EmptyState title="Product not found" description="The listing could not be loaded." />
      </Screen>
    );
  }

  const isOwner = user?.email && product.user?.email === user.email;

  return (
    <Screen>
      <AppCard style={styles.detailCard}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.detailImage} />
        ) : (
          <View style={[styles.detailImage, styles.productPlaceholder]}>
            <Ionicons name="cube-outline" size={54} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.inlineWrap}>
          <Pill tone="primary">{product.targetMarket || 'B2C'}</Pill>
          <Pill>{product.category || 'General'}</Pill>
          <Pill>MOQ {product.minimumOrderQuantity || 1}</Pill>
        </View>
        <Text style={styles.detailTitle}>{product.name}</Text>
        <Text style={styles.detailPrice}>{formatNPR(product.price || 0)}</Text>
        <Text style={styles.productText}>{product.description || 'No description available yet.'}</Text>
        <View style={styles.inlineWrap}>
          <StatTile label="Stock" value={String(product.stockQuantity || 0)} />
          <StatTile label="Seller type" value={product.user?.marketSegment || 'B2C'} />
        </View>
        {product.logisticsSupport ? (
          <AppCard style={styles.softSection}>
            <Text style={styles.productTitle}>Logistics support</Text>
            <Text style={styles.productText}>{product.logisticsSupport}</Text>
          </AppCard>
        ) : null}
        <Pressable
          style={styles.sellerRow}
          onPress={() => navigation.navigate('CreatorPage', { userId: product.user?.id })}
        >
          <Avatar source={product.user?.profileImage} label={product.user?.fullName} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.productTitle}>{product.user?.fullName || 'Unknown seller'}</Text>
            <Text style={styles.productText}>{product.user?.businessName || 'Independent retailer'}</Text>
          </View>
        </Pressable>
        {!isOwner && !product.sold ? (
          <AppButton title="Buy now" icon="cart-outline" onPress={handleBuy} loading={buying} />
        ) : (
          <Pill tone={product.sold ? 'danger' : 'success'}>
            {product.sold ? 'Already sold' : 'This is your own listing'}
          </Pill>
        )}
      </AppCard>
    </Screen>
  );
}

export function MyProductsScreen({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await api.get('/api/products');
      const allProducts = Array.isArray(response.data) ? response.data : [];
      const mine = allProducts.filter((product) => product.user?.username === user?.username);
      setProducts(mine.length === 0 ? allProducts : mine);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (productId) =>
    Alert.alert('Delete listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/products/${productId}`);
            setProducts((current) => current.filter((product) => product.id !== productId));
          } catch {
            Alert.alert('Delete failed', 'Could not remove the listing.');
          }
        }
      }
    ]);

  const stats = useMemo(() => {
    const active = products.filter((item) => !item.sold);
    const sold = products.filter((item) => item.sold);
    return {
      total: products.length,
      active: active.length,
      sold: sold.length,
      totalValue: active.reduce((sum, item) => sum + Number(item.price || 0), 0)
    };
  }, [products]);

  return (
    <Screen>
      <SectionTitle
        eyebrow="Seller studio"
        title="My inventory"
        description="Track live listings, remove old items, and keep stock visible in the mobile experience."
        right={<AppButton title="List new item" icon="add" onPress={() => navigation.navigate('CreateProduct')} />}
      />
      <View style={styles.inlineWrap}>
        <StatTile label="Total" value={String(stats.total)} />
        <StatTile label="Active" value={String(stats.active)} />
        <StatTile label="Sold" value={String(stats.sold)} />
        <StatTile label="Live value" value={formatNPR(stats.totalValue)} />
      </View>
      {loading ? (
        <Text style={styles.helperText}>Loading your listings...</Text>
      ) : products.length === 0 ? (
        <EmptyState title="No items listed" description="Create your first product to start selling." />
      ) : (
        products.map((product) => (
          <AppCard key={product.id} style={styles.inventoryCard}>
            <ProductCard product={product} onPress={() => navigation.navigate('ProductDetails', { id: product.id })} />
            <View style={styles.rowActions}>
              <AppButton title="View" variant="outline" onPress={() => navigation.navigate('ProductDetails', { id: product.id })} />
              <AppButton
                title="Delete"
                variant="ghost"
                onPress={() => handleDelete(product.id)}
                disabled={product.sold}
              />
            </View>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

export function MyOrdersScreen() {
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('purchases');
  const [location, setLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [draftLocation, setDraftLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [purchasesRes, salesRes, profileRes] = await Promise.all([
        api.get('/api/orders/purchases'),
        api.get('/api/orders/sales'),
        api.get('/api/profile')
      ]);
      setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      setLocation(profileRes.data?.location || 'Location not provided');
      setDraftLocation(profileRes.data?.location || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveLocation = async () => {
    try {
      await api.put('/api/profile', { location: draftLocation });
      setLocation(draftLocation || 'Location not provided');
      setEditingLocation(false);
    } catch {
      Alert.alert('Update failed', 'Could not update delivery location.');
    }
  };

  const orders = activeTab === 'purchases' ? purchases : sales;

  return (
    <Screen>
      <SectionTitle
        eyebrow="Order center"
        title="Order history"
        description="Track purchases, sales, delivery status, and your saved address."
      />
      <AppCard>
        <Text style={styles.productTitle}>My delivery address</Text>
        {editingLocation ? (
          <>
            <AppInput value={draftLocation} onChangeText={setDraftLocation} placeholder="Enter delivery address" />
            <View style={styles.rowActions}>
              <AppButton title="Save" onPress={saveLocation} />
              <AppButton title="Cancel" variant="outline" onPress={() => setEditingLocation(false)} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.productText}>{location}</Text>
            <AppButton title="Update address" variant="outline" onPress={() => setEditingLocation(true)} />
          </>
        )}
      </AppCard>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, activeTab === 'purchases' && styles.tabActive]} onPress={() => setActiveTab('purchases')}>
          <Text style={[styles.tabText, activeTab === 'purchases' && styles.tabTextActive]}>My purchases</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'sales' && styles.tabActive]} onPress={() => setActiveTab('sales')}>
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>Items sold</Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.helperText}>Loading your orders...</Text>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={activeTab === 'purchases' ? 'bag-check-outline' : 'cube-outline'}
          title={activeTab === 'purchases' ? 'No purchases yet' : 'No items sold yet'}
          description="This section mirrors the web order center layout with purchase and sales views."
        />
      ) : (
        orders.map((order) => (
          <AppCard key={order.id} style={styles.orderCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.productTitle}>
                {activeTab === 'purchases' ? 'Order' : 'Sale'} #{order.id}
              </Text>
              <Pill tone={order.status === 'DELIVERED' ? 'success' : 'primary'}>
                {order.status || 'PROCESSING'}
              </Pill>
            </View>
            <Text style={styles.productTitle}>{order.productName || 'Unknown item'}</Text>
            <Text style={styles.productText}>{order.productCategory || 'General'}</Text>
            <Text style={styles.productText}>
              {activeTab === 'purchases' ? 'Seller' : 'Buyer'}: {activeTab === 'purchases' ? order.sellerName : order.buyerName}
            </Text>
            <Text style={styles.productText}>
              {activeTab === 'purchases' ? 'Ships from' : 'Deliver to'}: {activeTab === 'purchases' ? order.sellerLocation : order.buyerLocation}
            </Text>
            {order.deliveryPersonName ? (
              <Text style={styles.productText}>Courier: {order.deliveryPersonName}</Text>
            ) : null}
            <View style={styles.rowBetween}>
              <Text style={styles.price}>{formatNPR(order.price || 0)}</Text>
              <Text style={styles.productText}>{formatDate(order.createdAt)}</Text>
            </View>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

export const marketplaceStyles = StyleSheet.create({
  helperText: { color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  productCard: { padding: 0, overflow: 'hidden' },
  productImage: { width: '100%', height: 220, backgroundColor: colors.surfaceMuted },
  productPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productBody: { padding: spacing.md, gap: 12 },
  productTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  productText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  price: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  profileRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  inlineWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  horizontalList: { gap: 12 },
  sellerCard: { width: 170, gap: 8, alignItems: 'flex-start' },
  linkText: { color: colors.primary, fontWeight: '700' },
  formCard: { gap: spacing.md },
  error: { color: colors.danger, backgroundColor: '#fdecec', padding: 12, borderRadius: 12 },
  uploadBox: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8
  },
  uploadPreview: { width: '100%', height: 220 },
  detailCard: { gap: spacing.md },
  detailImage: { width: '100%', height: 320, borderRadius: radius.md },
  detailTitle: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 34 },
  detailPrice: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  softSection: { backgroundColor: '#fff7ef' },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md
  },
  inventoryCard: { gap: 10, padding: 10 },
  rowActions: { flexDirection: 'row', gap: 10 },
  orderCard: { gap: 8 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.textMuted, fontWeight: '700' },
  tabTextActive: { color: colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  sellerLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }
});

const styles = marketplaceStyles;
