import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, SafeAreaView, ActivityIndicator
} from 'react-native';
import axios from 'axios';

// Ensure this matches your AuthContext API_URL
const API_URL = 'http://10.113.112.195:5000/api/listings';

export default function CategoryListingScreen({ route, navigation }) {
    const { category } = route.params;
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                // Encode the name because it might have spaces (e.g. "Farm Animals")
                const encodedCategory = encodeURIComponent(category.name);
                const res = await axios.get(`${API_URL}/category/${encodedCategory}`);

                // The backend returns an array of listing documents
                setListings(res.data);
            } catch (error) {
                console.error('Error fetching category listings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchListings();
    }, [category.name]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {category.name}
                </Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#1c3144" style={{ marginTop: 50 }} />
            ) : (
                <>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.resultCount}>{listings.length} professionals available</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {listings.map((item) => (
                            <TouchableOpacity
                                key={item._id || item.id}
                                style={styles.card}
                                onPress={() => navigation.navigate('ListingDetail', { listing: item, category })}
                            >
                                <View style={styles.cardTop}>
                                    <View style={[styles.iconCircle]}>
                                        <Text style={styles.itemIcon}>{category.icon}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemLocation}>👤 {item.providerId?.name || 'Local Provider'}</Text>
                                    </View>
                                    <View style={styles.priceBox}>
                                        <Text style={styles.price}>₹{item.price}</Text>
                                        <View style={[styles.badge, { backgroundColor: item.available ? '#a4c3b2' : '#e5989b' }]}>
                                            <Text style={[styles.badgeText, { color: item.available ? '#1b4332' : '#5c1b1b' }]}>
                                                {item.available ? 'Available' : 'Busy'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40, // Increased margin
        marginBottom: 16,
    },
    backBtn: {
        marginRight: 16,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: {
        color: '#111827',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#111827',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    resultCount: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemIcon: {
        fontSize: 30,
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 17,
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    itemLocation: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    priceBox: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    price: {
        color: '#111827',
        fontWeight: '800',
        fontSize: 18,
        marginBottom: 8,
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});