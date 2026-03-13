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
                <Text style={styles.headerTitle}>Explore Map</Text>
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
        top: 50, // Avoid safe area
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backBtn: {
        marginRight: 16,
        padding: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
    },
    backIcon: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
    headerTitle: { color: '#111827', fontSize: 20, fontWeight: '800' },
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
        borderRadius: 12,
        padding: 16,
        minWidth: 200,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    calloutTitle: { color: '#111827', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    calloutCategory: { color: '#6b7280', fontSize: 13, marginBottom: 12 },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    calloutPrice: { color: '#111827', fontSize: 16, fontWeight: '800' },
    linkText: { color: '#111827', fontSize: 12, fontWeight: '700' }
});
