import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, SafeAreaView, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../utils/config';

// Ensure this matches your AuthContext API_URL
const API_URL = `${BASE_URL}/api/listings`;

export default function CategoryListingScreen({ route, navigation }) {
    const { category } = route.params;
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [favoriteIds, setFavoriteIds] = useState([]);

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

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BASE_URL}/api/auth/favorites`, {
                headers: { 'x-auth-token': token }
            });
            setFavoriteIds(res.data.map(f => f._id || f));
        } catch (err) { /* ignore */ }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFavorites();
        });
        return unsubscribe;
    }, [navigation]);

    const handleToggleFavorite = async (listingId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please log in to favorite services.');
                return;
            }
            const res = await axios.post(`${BASE_URL}/api/auth/favorites/${listingId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            setFavoriteIds(res.data);
        } catch (err) {
            console.error('Toggle Favorite Error:', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{category.name}</Text>
                    <Text style={styles.headerSub}>{listings.length} professionals available</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#1c3144" style={{ marginTop: 50 }} />
            ) : (

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {listings.map((item) => (
                        <TouchableOpacity
                            key={item._id || item.id}
                            style={styles.listingCard}
                            onPress={() => navigation.navigate('ListingDetail', { listing: item, category })}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.cardLeft}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <View style={styles.providerTag}>
                                        <Text style={styles.providerText}>👤 {item.providerId?.name || 'Expert'}</Text>
                                        {item.providerId?.isVerified && <Text style={styles.verifiedIcon}>✅</Text>}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleToggleFavorite(item._id || item.id)}
                                    style={styles.favAction}
                                >
                                    <Text style={styles.favIcon}>
                                        {favoriteIds.includes(item._id || item.id) ? '❤️' : '🤍'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>{item.price}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: item.available ? '#dcfce7' : '#fee2e2' }]}>
                                    <Text style={[styles.statusBadgeText, { color: item.available ? '#166534' : '#991b1b' }]}>
                                        {item.available ? '● Available' : '● Busy'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
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
        fontFamily: 'Inter_700Bold',
    },
    headerTitle: { color: '#111827', fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    headerSub: { color: '#6b7280', fontSize: 15, marginTop: 2, fontFamily: 'Inter_500Medium' },
    sectionHeader: {
        marginBottom: 20,
    },
    resultCount: {
        color: '#6b7280',
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    listingCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    cardLeft: { flex: 1 },
    itemName: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    providerTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerText: {
        color: '#6b7280',
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    verifiedIcon: {
        marginLeft: 4,
        fontSize: 12,
    },
    favAction: {
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    favIcon: {
        fontSize: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    priceBadge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    priceText: {
        color: '#111827',
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 18,
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontFamily: 'Inter_800ExtraBold',
        letterSpacing: 0.5,
    },
});