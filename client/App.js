import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './context/AuthContext';
import { ProviderProvider } from './screens/provider/ProviderContext';
import { LanguageProvider } from './context/LanguageContext';
import { StripeProvider } from '@stripe/stripe-react-native';

import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/home/HomeScreen';
import CategoryListingScreen from './screens/home/CategoryListingScreen';
import ListingDetailScreen from './screens/home/ListingDetailScreen';
import BookingScreen from './screens/home/BookingScreen';
import MapScreen from './screens/home/MapScreen';
import ConsumerBookingsScreen from './screens/consumer/ConsumerBookingsScreen';
import ChatScreen from './screens/shared/ChatScreen';
import SearchScreen from './screens/home/SearchScreen';
import ProviderDashboardScreen from './screens/provider/ProviderDashboardScreen';
import ProviderBookingsScreen from './screens/provider/ProviderBookingsScreen';
import AddListingScreen from './screens/provider/AddListingScreen';
import EditListingScreen from './screens/provider/EditListingScreen';
import ProfileScreen from './screens/home/ProfileScreen';
import FavoritesScreen from './screens/consumer/FavoritesScreen';
import OnboardingScreen from './screens/auth/OnboardingScreen';
import WalletScreen from './screens/provider/WalletScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <StripeProvider publishableKey="pk_test_placeholder">
            <LanguageProvider>
                <AuthProvider>
                    <ProviderProvider>
                        <NavigationContainer>
                            <Stack.Navigator
                                initialRouteName="Onboarding"
                                screenOptions={{ headerShown: false }}
                            >
                                {/* Auth Screens */}
                                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                                <Stack.Screen name="Login" component={LoginScreen} />
                                <Stack.Screen name="Register" component={RegisterScreen} />

                                {/* Consumer Screens */}
                                <Stack.Screen name="Home" component={HomeScreen} />
                                <Stack.Screen name="CategoryListing" component={CategoryListingScreen} />
                                <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
                                <Stack.Screen name="BookingScreen" component={BookingScreen} />
                                <Stack.Screen name="ConsumerBookings" component={ConsumerBookingsScreen} />
                                <Stack.Screen name="MapScreen" component={MapScreen} />
                                <Stack.Screen name="ChatScreen" component={ChatScreen} />
                                <Stack.Screen name="SearchScreen" component={SearchScreen} />
                                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                                <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} />

                                {/* Provider Screens */}
                                <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
                                <Stack.Screen name="ProviderBookings" component={ProviderBookingsScreen} />
                                <Stack.Screen name="AddListing" component={AddListingScreen} />
                                <Stack.Screen name="EditListing" component={EditListingScreen} />
                                <Stack.Screen name="WalletScreen" component={WalletScreen} />
                            </Stack.Navigator>
                        </NavigationContainer>
                    </ProviderProvider>
                </AuthProvider>
            </LanguageProvider>
        </StripeProvider>
    );
}
