import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './context/AuthContext';
import { ProviderProvider } from './screens/provider/ProviderContext';

import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/home/HomeScreen';
import CategoryListingScreen from './screens/home/CategoryListingScreen';
import ListingDetailScreen from './screens/home/ListingDetailScreen';
import BookingScreen from './screens/home/BookingScreen';
import ChatScreen from './screens/shared/ChatScreen';
import SearchScreen from './screens/home/SearchScreen';
import ProviderDashboardScreen from './screens/provider/ProviderDashboardScreen';
import ProviderBookingsScreen from './screens/provider/ProviderBookingsScreen';
import AddListingScreen from './screens/provider/AddListingScreen';
import EditListingScreen from './screens/provider/EditListingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <AuthProvider>
            <ProviderProvider>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName="Login"
                        screenOptions={{ headerShown: false }}
                    >
                        {/* Auth Screens */}
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

                        {/* Provider Screens */}
                        <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
                        <Stack.Screen name="ProviderBookings" component={ProviderBookingsScreen} />
                        <Stack.Screen name="AddListing" component={AddListingScreen} />
                        <Stack.Screen name="EditListing" component={EditListingScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </ProviderProvider>
        </AuthProvider>
    );
}
