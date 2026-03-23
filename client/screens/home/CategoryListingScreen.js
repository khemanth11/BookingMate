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
            const res = await axios.get('http://10.113.112.195:5000/api/auth/favorites', {
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
            const res = await axios.post(`http://10.113.112.195:5000/api/auth/favorites/${listingId}`, {}, {
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
                                        <Text style={styles.priceText}>₹{item.price}</Text>
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
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerSub: { color: '#64748b', fontSize: 15, marginTop: 2, fontWeight: '600' },
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
    listingCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    cardLeft: { flex: 1 },
    itemName: {
        color: '#0f172a',
        fontWeight: '800',
        fontSize: 20,
        marginBottom: 6,
        letterSpacing: -0.4,
    },
    providerTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
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
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    priceText: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 18,
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});