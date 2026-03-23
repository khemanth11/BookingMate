import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ScrollView, FlatList, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.113.112.195:5000/api';

export default function ProfileScreen({ route, navigation }) {
    const { providerId, providerName } = route.params;
    const [profile, setProfile] = useState(null);
    const [listings, setListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [profileRes, reviewsRes, listingsRes] = await Promise.all([
                axios.get(`${API_URL}/auth/profile/${providerId}`),
                axios.get(`${API_URL}/reviews/provider/${providerId}`),
                axios.get(`${API_URL}/listings`)
            ]);
            setProfile(profileRes.data);
            setReviews(reviewsRes.data || []);
            // Filter listings by this provider
            setListings(listingsRes.data.filter(l => 
                (l.providerId?._id || l.providerId) === providerId
            ));
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStars = (rating) => {
        const filled = Math.round(rating);
        return '★'.repeat(filled) + '☆'.repeat(5 - filled);
    };

    const getAverageRating = () => {
        if (reviews.length === 0) return 0;
        return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#111827" style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <Text style={styles.headerSub}>Detailed expert information</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {(profile?.name || 'P').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.nameRow}>
                        <Text style={styles.profileName}>{profile?.name || providerName}</Text>
                        {profile?.isVerified && <Text style={styles.verifiedCheck}>✅</Text>}
                    </View>
                    <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                    
                    {profile?.bio ? (
                        <Text style={styles.profileBio}>{profile.bio}</Text>
                    ) : null}

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{listings.length}</Text>
                            <Text style={styles.statLabel}>Listings</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile?.completedJobsCount || 0}</Text>
                            <Text style={styles.statLabel}>Jobs Done</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {reviews.length > 0 ? `⭐ ${getAverageRating()}` : 'New'}
                            </Text>
                            <Text style={styles.statLabel}>{reviews.length} Reviews</Text>
                        </View>
                    </View>
                </View>

                {/* Provider Listings */}
                {listings.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Services Offered</Text>
                        {listings.map((item) => (
                            <View key={item._id} style={styles.listingCard}>
                                <Text style={styles.listingName}>{item.name}</Text>
                                <View style={styles.listingMeta}>
                                    <Text style={styles.listingCategory}>{item.category}</Text>
                                    <Text style={styles.listingPrice}>₹{item.price}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                        {reviews.slice(0, 10).map((review, idx) => (
                            <View key={review._id || idx} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{review.reviewerId?.name || 'Customer'}</Text>
                                    <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                                </View>
                                {review.reviewText ? (
                                    <Text style={styles.reviewText}>"{review.reviewText}"</Text>
                                ) : null}
                                {review.listingId?.name ? (
                                    <View style={styles.reviewListingTag}>
                                        <Text style={styles.reviewListingText}>Service: {review.listingId.name}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6f8', paddingHorizontal: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 16,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerSub: { color: '#64748b', fontSize: 15, marginTop: 2, fontWeight: '600' },

    // Profile Card
    profileCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '800',
    },
    profileName: {
        color: '#0f172a',
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    verifiedCheck: {
        marginLeft: 8,
        fontSize: 20,
    },
    profileEmail: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 16,
    },
    profileBio: {
        color: '#334155',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        paddingHorizontal: 10,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 16,
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    statItem: { alignItems: 'center' },
    statValue: { color: '#0f172a', fontSize: 22, fontWeight: '900' },
    statLabel: { color: '#64748b', fontSize: 13, fontWeight: '700', marginTop: 4 },
    statDivider: { width: 1, height: 32, backgroundColor: '#f1f5f9' },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: {
        color: '#0f172a',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: -0.5,
    },

    // Listing Cards
    listingCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    listingName: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
    listingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listingCategory: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    listingPrice: { color: '#0f172a', fontSize: 16, fontWeight: '900' },

    // Review Cards
    reviewCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewerName: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
    reviewStars: { color: '#f59e0b', fontSize: 16 },
    reviewText: { color: '#64748b', fontSize: 15, lineHeight: 22, marginBottom: 12, fontStyle: 'italic', fontWeight: '500' },
    reviewListingTag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    reviewListingText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
});
