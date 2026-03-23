import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.113.112.195:5000/api/listings';

export default function MapScreen() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    // Default map region (e.g. Hyderabad, India - adjust as needed)
    const initialRegion = {
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await axios.get(API_URL);
            // Filter out listings that don't have valid coordinate data
            const validListings = res.data.filter(l => l.location && l.location.latitude && l.location.longitude);
            setListings(validListings);
        } catch (error) {
            console.error('Error fetching map listings:', error);
            Alert.alert('Error', 'Could not load map data.');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToDetail = (listing) => {
        // Find dummy category data to pass to detail screen for styling 
        // (In a real app, this should ideally come from the listing or a CategoryContext)
        const dummyCategory = {
            name: listing.category,
            icon: '📍',
            color: '#1a472a'
        };
        navigation.navigate('ListingDetail', { listing, category: dummyCategory });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header overlay */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Explore Map</Text>
                    <Text style={styles.headerSub}>Services near you</Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1c3144" />
                    <Text style={styles.loadingText}>Loading services near you...</Text>
                </View>
            ) : (
                <MapView
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    userInterfaceStyle="light" // Modern light theme map
                >
                    {listings.map((listing) => (
                        <Marker
                            key={listing._id}
                            coordinate={{
                                latitude: listing.location.latitude,
                                longitude: listing.location.longitude
                            }}
                        >
                            <Callout onPress={() => navigateToDetail(listing)} tooltip>
                                <View style={styles.calloutContainer}>
                                    <Text style={styles.calloutTitle}>{listing.name}</Text>
                                    <Text style={styles.calloutCategory}>{listing.category}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.calloutPrice}>₹{listing.price}</Text>
                                        <Text style={styles.linkText}>View Details →</Text>
                                    </View>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
    },
    header: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    backBtn: {
        marginRight: 16,
        padding: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
    },
    backIcon: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
    headerTitle: { color: '#0f172a', fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
    headerSub: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: -2 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#6b7280',
        marginTop: 12,
        fontSize: 16,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    calloutContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        minWidth: 220,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    calloutTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.4 },
    calloutCategory: { color: '#64748b', fontSize: 13, marginBottom: 16, fontWeight: '600' },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
    },
    calloutPrice: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
    linkText: { color: '#3b82f6', fontSize: 13, fontWeight: '700' }
});
