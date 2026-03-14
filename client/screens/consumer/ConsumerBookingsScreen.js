import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator
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

    const fetchBookings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/me`, {
                headers: { 'x-auth-token': token }
            });
            setBookings(res.data);
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
    }, [navigation, fetchBookings]);

    const renderItem = ({ item }) => {
        const getStatusColor = () => {
            switch (item.status) {
                case 'confirmed': return '#1a472a'; // Green
                case 'cancelled':
                case 'rejected': return '#5e1a1a'; // Dark Red
                case 'completed': return '#0f3460'; // Blue
                default: return '#b8860b'; // Yellow for Pending
            }
        };

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.listingId?.name || 'Unknown Service'}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
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
                        style={styles.chatBtn}
                        onPress={() => navigation.navigate('ChatScreen', {
                            bookingId: item._id,
                            receiverName: item.providerId?.name || 'Provider',
                            receiverPhone: item.providerId?.phone,
                            senderId: user?.id
                        })}
                    >
                        <Text style={styles.chatBtnText}>💬 Open Chat & Call</Text>
                    </TouchableOpacity>
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
    headerTitle: { color: '#111827', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    headerSub: { color: '#6b7280', fontSize: 14, marginTop: 4, fontWeight: '500' },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitle: { color: '#111827', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
    badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    cardInfo: { color: '#6b7280', fontSize: 14, marginBottom: 8, fontWeight: '500' },
    verifiedBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    verifiedText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusMsg: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        color: '#b07d00',
        fontSize: 13,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    chatBtn: {
        marginTop: 16,
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    chatBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15
    },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 50, marginBottom: 16 },
    emptyText: { color: '#111827', fontSize: 22, fontWeight: '800' },
    emptyHint: { color: '#6b7280', fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 22 },
});
