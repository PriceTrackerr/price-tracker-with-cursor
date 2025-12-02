import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Bell, Crown } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProScreen from '../screens/ProScreen';

export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    ProductDetail: { productId: string };
};

export type TabParamList = {
    Dashboard: undefined;
    Alerts: undefined;
    Pro: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0f172a',
                    borderTopColor: '#1e293b',
                },
                tabBarActiveTintColor: '#6366f1',
                tabBarInactiveTintColor: '#64748b',
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Pro"
                component={ProScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Crown color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function Navigation() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
