import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import {
  CreateProductScreen,
  DashboardScreen,
  MyOrdersScreen,
  MyProductsScreen,
  ProductDetailsScreen
} from '../screens/MarketplaceCoreScreens';
import {
  CreatorPageScreen,
  ProfileScreen,
  RetailInventoryScreen,
  ServicesScreen
} from '../screens/MarketplaceMoreScreens';
import {
  DeliveryDashboardScreen,
  GroupChatScreen,
  GroupsScreen
} from '../screens/CommunityScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileHeaderAction() {
  const { logout } = useAuth();
  return (
    <Text onPress={logout} style={{ color: colors.primary, fontWeight: '700' }}>
      Logout
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 70, paddingTop: 8, paddingBottom: 12 },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Dashboard: 'home-outline',
            MyProducts: 'cube-outline',
            Services: 'briefcase-outline',
            CreateProduct: 'add-circle-outline',
            Profile: 'person-outline'
          };
          return <Ionicons name={map[route.name] || 'ellipse-outline'} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="CreateProduct" component={CreateProductScreen} options={{ title: 'Create' }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerRight: ProfileHeaderAction
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="RetailInventory" component={RetailInventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="CreatorPage" component={CreatorPageScreen} options={{ title: 'Owner Page' }} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} options={({ route }) => ({ title: route.params?.name || 'Group Chat' })} />
      <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboardScreen} options={{ title: 'Deliveries' }} />
      {!user?.deliveryPerson ? null : (
        <Stack.Screen
          name="CourierShortcut"
          component={DeliveryDashboardScreen}
          options={{ title: 'Courier Dispatch' }}
        />
      )}
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <AppStack /> : <AuthStack />;
}
