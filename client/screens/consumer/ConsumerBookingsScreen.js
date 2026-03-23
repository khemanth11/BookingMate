import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal, TextInput
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://10.113.112.195:5000/api/bookings';

export default function ConsumerBookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();
    const { user } = useAuth();
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewBookingId, setReviewBookingId] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState({});

    const fetchBookings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/me`, {
                headers: { 'x-auth-token': token }
            });
            setBookings(res.data);

            // Check which completed bookings have been reviewed
            const completedBookings = res.data.filter(b => b.status === 'completed');
            const reviewChecks = {};
            for (const b of completedBookings) {
                try {
                    const checkRes = await axios.get(`http://10.113.112.195:5000/api/reviews/check/${b._id}`, {
                        headers: { 'x-auth-token': token }
                    });
                    reviewChecks[b._id] = checkRes.data.reviewed;
                } catch (e) { /* ignore */ }
            }
            setReviewedBookings(reviewChecks);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Error', 'Could not load your bookings.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchBookings();
        });
        return unsubscribe;
    }, [fetchBookings]);

    const handleCancel = async (bookingId) => {
        Alert.alert(
            'Cancel Booking?',
            'Are you sure you want to cancel this booking request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.put(`${API_URL}/${bookingId}/cancel`, {}, {
                                headers: { 'x-auth-token': token }
                            });
                            Alert.alert('Success', 'Booking has been cancelled.');
                            fetchBookings();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking.');
                        }
                    }
                }
            ]
        );
    };

    const handleVerifyCompletion = async (bookingId) => {
        Alert.alert(
            'Confirm Completion?',
            'By verifying, you confirm the service is complete and the funds will be released to the provider.',
            [
                { text: 'Wait', style: 'cancel' },
                {
                    text: 'Verify & Release',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.put(`${API_URL}/${bookingId}/consumer-verify`, {}, {
                                headers: { 'x-auth-token': token }
                            });
                            Alert.alert('Success', 'Verification complete! Funds have been released.');
                            fetchBookings();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to verify completion.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const getStatusStyles = () => {
            switch (item.status) {
                case 'confirmed': return { bg: '#dcfce7', text: '#166534' };
                case 'cancelled':
                case 'rejected': return { bg: '#fee2e2', text: '#991b1b' };
                case 'completed': return { bg: '#eff6ff', text: '#1e40af' }; // Blue for AI verified
                case 'verified': return { bg: '#dcfce7', text: '#166534' }; // Green for both verified
                default: return { bg: '#fef3c7', text: '#92400e' }; // Pending
            }
        };

        const statusStyle = getStatusStyles();

        return (
            <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.listingId?.name || 'Unknown Service'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                            ● {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {item.isAiVerified && (
                    <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✅ AI Verified Selection</Text>
                    </View>
                )}

                <Text style={styles.cardInfo}>🧑‍🔧 Provider: {item.providerId?.name || 'Local Expert'}</Text>
                <Text style={styles.cardInfo}>📅 Date: {item.date}</Text>
                <Text style={styles.cardInfo}>⏰ Time: {item.startTime} - {item.endTime}</Text>
                <Text style={styles.cardInfo}>💰 Price: ₹{item.listingId?.price || 'Unlisted'}</Text>

                {item.status === 'pending' && (
                    <Text style={styles.statusMsg}>Waiting for the provider to confirm your request.</Text>
                )}
                {item.status === 'confirmed' && (
                    <TouchableOpacity
                        style={styles.chatActionBtn}
                        onPress={() => navigation.navigate('ChatScreen', {
                            bookingId: item._id,
                            receiverName: item.providerId?.name || 'Provider',
                            receiverPhone: item.providerId?.phone,
                            senderId: user?.id
                        })}
                    >
                        <Text style={styles.chatActionBtnText}>💬 Chat with Provider</Text>
                    </TouchableOpacity>
                )}
                {(item.status === 'pending' || item.status === 'confirmed') && (
                    <TouchableOpacity
                        style={styles.cancelActionBtn}
                        onPress={() => handleCancel(item._id)}
                    >
                        <Text style={styles.cancelActionBtnText}>✕ Cancel Request</Text>
                    </TouchableOpacity>
                )}

                {item.status === 'completed' && !item.consumerVerified && (
                    <TouchableOpacity
                        style={styles.verifyActionBtn}
                        onPress={() => handleVerifyCompletion(item._id)}
                    >
                        <Text style={styles.verifyActionBtnText}>✅ Verify & Release Funds</Text>
                    </TouchableOpacity>
                )}

                {item.payoutReleased && (
                    <View style={styles.payoutBadge}>
                        <Text style={styles.payoutText}>💰 Funds Released to Provider</Text>
                    </View>
                )}

                {item.status === 'completed' && !item.consumerVerified && (
                    <TouchableOpacity
                        style={styles.verifyActionBtn}
                        onPress={() => handleVerifyCompletion(item._id)}
                    >
                        <Text style={styles.verifyActionBtnText}>✅ Verify & Release Funds</Text>
                    </TouchableOpacity>
                )}

                {item.payoutReleased && (
                    <View style={styles.payoutBadge}>
                        <Text style={styles.payoutText}>💰 Funds Released to Provider</Text>
                    </View>
                )}
                {item.status === 'completed' && !reviewedBookings[item._id] && (
                    <TouchableOpacity
                        style={styles.reviewActionBtn}
                        onPress={() => {
                            setReviewBookingId(item._id);
                            setReviewRating(0);
                            setReviewText('');
                            setReviewModalVisible(true);
                        }}
                    >
                        <Text style={styles.reviewActionBtnText}>⭐ Write a Review</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'completed' && reviewedBookings[item._id] && (
                    <View style={styles.reviewedTag}>
                        <Text style={styles.reviewedTagText}>✅ Reviewed</Text>
                    </View>
                )}
            </View>
        );
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
                    <Text style={styles.headerTitle}>My Bookings</Text>
                    <Text style={styles.headerSub}>Track your service requests</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#1c3144" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>No bookings found</Text>
                            <Text style={styles.emptyHint}>You have not scheduled any services yet. Explore the home screen to find what you need.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {/* Review Modal */}
            <Modal visible={reviewModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⭐ Rate this Service</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                                    <Text style={[styles.starBtn, reviewRating >= star && styles.starActive]}>
                                        {reviewRating >= star ? '★' : '☆'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Write your review (optional)..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            value={reviewText}
                            onChangeText={setReviewText}
                        />
                        <TouchableOpacity
                            style={[styles.submitReviewBtn, (!reviewRating || isSubmittingReview) && { opacity: 0.5 }]}
                            disabled={!reviewRating || isSubmittingReview}
                            onPress={async () => {
                                setIsSubmittingReview(true);
                                try {
                                    const token = await AsyncStorage.getItem('token');
                                    await axios.post('http://10.113.112.195:5000/api/reviews', {
                                        bookingId: reviewBookingId,
                                        rating: reviewRating,
                                        reviewText
                                    }, { headers: { 'x-auth-token': token } });
                                    Alert.alert('Thank you!', 'Your review has been submitted.');
                                    setReviewModalVisible(false);
                                    setReviewedBookings(prev => ({ ...prev, [reviewBookingId]: true }));
                                } catch (err) {
                                    Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
                                } finally {
                                    setIsSubmittingReview(false);
                                }
                            }}
                        >
                            {isSubmittingReview ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitReviewText}>Submit Review</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                            <Text style={styles.cancelReviewText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6f8', paddingHorizontal: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40, // Increased margin
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 15,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerSub: { color: '#64748b', fontSize: 15, marginTop: 2, fontWeight: '600' },
    bookingCard: {
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
        marginBottom: 16,
    },
    cardTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', flex: 1, marginRight: 10, letterSpacing: -0.3 },
    statusBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    cardInfo: { color: '#64748b', fontSize: 15, marginBottom: 10, fontWeight: '600' },
    verifiedBadge: {
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#5eead4',
    },
    verifiedText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusMsg: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        color: '#92400e',
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '600',
    },
    chatActionBtn: {
        marginTop: 20,
        backgroundColor: '#0f172a',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    cancelActionBtnText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 15,
    },
    chatActionBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16
    },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 50, marginBottom: 16 },
    emptyText: { color: '#111827', fontSize: 22, fontWeight: '800' },
    emptyHint: { color: '#6b7280', fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 22 },
    reviewActionBtn: {
        marginTop: 16,
        backgroundColor: '#fef3c7',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    reviewActionBtnText: { color: '#92400e', fontWeight: '800', fontSize: 16 },
    reviewedTag: {
        marginTop: 12,
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    reviewedTagText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 13,
    },
    cancelActionBtnText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 15,
    },
    verifyActionBtn: {
        marginTop: 20,
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyActionBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16
    },
    payoutBadge: {
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 14,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#dcfce7',
        alignItems: 'center'
    },
    payoutText: {
        color: '#166534',
        fontWeight: '800',
        fontSize: 13
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    modalTitle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 20,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    starBtn: {
        fontSize: 36,
        color: '#d1d5db',
    },
    starActive: {
        color: '#f59e0b',
    },
    reviewInput: {
        width: '100%',
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 20,
    },
    submitReviewBtn: {
        backgroundColor: '#111827',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 40,
        alignItems: 'center',
        marginBottom: 12,
    },
    submitReviewText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelReviewText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
    },
});
