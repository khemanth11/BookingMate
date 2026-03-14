import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal, Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://10.113.112.195:5000/api/bookings';

export default function ProviderBookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();
    const { user } = useAuth();
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);
    const [verifyingBookingId, setVerifyingBookingId] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/provider`, {
                headers: { 'x-auth-token': token }
            });
            setBookings(res.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Error', 'Could not load your incoming requests.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Run code when the screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            fetchBookings();
        });
        return unsubscribe;
    }, [navigation, fetchBookings]);

    const updateStatus = async (id, newStatus) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${API_URL}/${id}/status`, { status: newStatus }, {
                headers: { 'x-auth-token': token }
            });

            // Optimistic update of UI
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
            Alert.alert('Success', `Booking marked as ${newStatus}`);
        } catch (error) {
            console.error(`Error updating to ${newStatus}:`, error);
            Alert.alert('Error', 'Failed to update booking status.');
        }
    };

    const handleVerifyAndComplete = async (bookingId) => {
        if (!permission || !permission.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert('Permission Rejected', 'Camera access is required for AI verification.');
                return;
            }
        }
        setVerifyingBookingId(bookingId);
        setIsCameraVisible(true);
    };

    const takePictureAndVerify = async () => {
        if (!cameraRef) return;

        try {
            setIsVerifying(true);
            const photo = await cameraRef.takePictureAsync({
                quality: 0.2,
                base64: true,
                exif: false,
            });

            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`http://10.113.112.195:5000/api/ai/verify-job-completion`, {
                image: photo.base64,
                bookingId: verifyingBookingId
            }, {
                headers: { 'x-auth-token': token }
            });

            setIsVerifying(false);
            setIsCameraVisible(false);

            if (res.data.verified) {
                Alert.alert('✅ AI Verified', 'The job completion was verified successfully!');
                fetchBookings(); // Refresh list
            } else {
                Alert.alert('❌ Verification Failed', res.data.reasoning || 'The photo does not appear to show a completed job.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setIsVerifying(false);
            Alert.alert('Error', 'An error occurred during verification.');
        }
    };

    const renderItem = ({ item }) => {
        // Quick badge colors based on status
        const getStatusColor = () => {
            switch (item.status) {
                case 'confirmed': return '#1a472a'; // Green
                case 'rejected': return '#5e1a1a'; // Dark Red
                case 'completed': return '#0f3460'; // Blue
                default: return '#b8860b'; // Yellow/Orange for Pending
            }
        };

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.listingId?.name || 'Deleted Listing'}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.cardInfo}>👤 Customer: {item.userId?.name || 'Unknown'}</Text>
                <Text style={styles.cardInfo}>📞 Phone: {item.userId?.phone || 'N/A'}</Text>
                <Text style={styles.cardInfo}>📅 Date: {item.date}</Text>
                <Text style={styles.cardInfo}>⏰ Time: {item.startTime} - {item.endTime}</Text>
                <Text style={styles.cardInfo}>💰 Price: ₹{item.listingId?.price || 'N/A'}</Text>

                {item.status === 'pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => updateStatus(item._id, 'confirmed')}
                        >
                            <Text style={[styles.btnText, { color: '#065F46' }]}>✓ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => updateStatus(item._id, 'rejected')}
                        >
                            <Text style={[styles.btnText, { color: '#991B1B' }]}>✗ Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Provide a Complete option and Chat option if it's confirmed */}
                {item.status === 'confirmed' && (
                    <View style={[styles.actions, { marginTop: 16 }]}>
                        <TouchableOpacity
                            style={styles.completeBtn}
                            onPress={() => handleVerifyAndComplete(item._id)}
                        >
                            <Text style={[styles.btnText, { color: '#1D4ED8' }]}>📸 Verify & Complete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.providerChatBtn}
                            onPress={() => navigation.navigate('ChatScreen', {
                                bookingId: item._id,
                                receiverName: item.userId?.name || 'Customer',
                                receiverPhone: item.userId?.phone,
                                senderId: user?.id
                            })}
                        >
                            <Text style={styles.providerChatText}>💬 Chat</Text>
                        </TouchableOpacity>
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
                    <Text style={styles.backIcon}>← </Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Booking Requests</Text>
                    <Text style={styles.headerSub}>Manage your incoming jobs</Text>
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
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No requests yet.</Text>
                            <Text style={styles.emptyHint}>When consumers book your services, they will appear here.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {/* Camera Modal */}
            <Modal visible={isCameraVisible} animationType="slide">
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        ref={(ref) => setCameraRef(ref)}
                    >
                        <View style={styles.cameraOverlay}>
                            <Text style={styles.cameraTip}>Center the completed work in frame</Text>
                            {isVerifying ? (
                                <ActivityIndicator size="large" color="#ffffff" />
                            ) : (
                                <View style={styles.cameraActions}>
                                    <TouchableOpacity 
                                        style={styles.captureBtn} 
                                        onPress={takePictureAndVerify}
                                    >
                                        <View style={styles.captureInner} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.cancelCameraBtn} 
                                        onPress={() => setIsCameraVisible(false)}
                                    >
                                        <Text style={styles.cancelCameraText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </CameraView>
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
    backIcon: { color: '#111827', fontSize: 16, fontWeight: 'bold' },
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
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 12,
    },
    cardTitle: { color: '#111827', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
    badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    cardInfo: { color: '#6b7280', fontSize: 14, marginBottom: 8, fontWeight: '500' },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 16,
    },
    acceptBtn: {
        flex: 1, backgroundColor: '#a4c3b2',
        borderRadius: 12, padding: 14, alignItems: 'center',
    },
    rejectBtn: {
        flex: 1, backgroundColor: '#fca5a5',
        borderRadius: 12, padding: 14, alignItems: 'center',
    },
    completeBtn: {
        flex: 1, backgroundColor: '#bfdbfe',
        borderRadius: 12, padding: 14, alignItems: 'center',
    },
    providerChatBtn: {
        flex: 1, backgroundColor: '#f3f4f6',
        borderRadius: 12, padding: 14, alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    providerChatText: { color: '#111827', fontWeight: 'bold' },
    btnText: { fontWeight: 'bold', fontSize: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 50, marginBottom: 16 },
    emptyText: { color: '#111827', fontSize: 22, fontWeight: '800' },
    emptyHint: { color: '#6b7280', fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 22 },
    
    // Camera Styles
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40
    },
    cameraTip: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    cameraActions: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff'
    },
    cancelCameraBtn: {
        position: 'absolute',
        right: 40,
        padding: 10
    },
    cancelCameraText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
