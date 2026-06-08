import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal, Image, TextInput
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/config';

const API_URL = `${BASE_URL}/api/bookings`;

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
    const [otpInputs, setOtpInputs] = useState({});
    const [isSubmittingOtp, setIsSubmittingOtp] = useState({});

    const handleVerifyOtp = async (bookingId) => {
        const otp = otpInputs[bookingId];
        if (!otp || otp.length !== 4) {
            Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP code.');
            return;
        }

        try {
            setIsSubmittingOtp(prev => ({ ...prev, [bookingId]: true }));
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${API_URL}/${bookingId}/verify-otp`, { otp }, {
                headers: { 'x-auth-token': token }
            });

            Alert.alert('🎉 Success', res.data.message || 'OTP verified and payout released!');
            setOtpInputs(prev => {
                const copy = { ...prev };
                delete copy[bookingId];
                return copy;
            });
            fetchBookings();
        } catch (error) {
            console.error('OTP Verification error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to verify OTP.');
        } finally {
            setIsSubmittingOtp(prev => ({ ...prev, [bookingId]: false }));
        }
    };

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
            const res = await axios.post(`${BASE_URL}/api/ai/verify-job-completion`, {
                image: photo.base64,
                bookingId: verifyingBookingId
            }, {
                headers: { 'x-auth-token': token }
            });

            setIsVerifying(false);
            setIsCameraVisible(false);

            if (res.data.verified) {
                // Now call the official dual-verification endpoint for provider
                await axios.put(`${API_URL}/${verifyingBookingId}/provider-verify`, {}, {
                    headers: { 'x-auth-token': token }
                });

                Alert.alert('✅ AI Verified', 'Job completion verified! Funds will be released once the consumer also confirms.');
                fetchBookings(); // Refresh list to show new status
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
                case 'confirmed': return '#10b981'; // Emerald
                case 'rejected': return '#f43f5e'; // Rose
                case 'completed': return '#3b82f6'; // Blue
                default: return '#64748b'; // Slate for Pending
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
                <Text style={styles.cardInfo}>💰 Price: {item.listingId?.price || 'N/A'}</Text>

                <View style={styles.verificationRow}>
                    <Text style={[styles.verifBadge, item.providerVerified ? styles.verifSuccess : styles.verifPending]}>
                        {item.providerVerified ? '✓ AI Verified' : '○ AI Pending'}
                    </Text>
                    <Text style={[styles.verifBadge, item.consumerVerified ? styles.verifSuccess : styles.verifPending]}>
                        {item.consumerVerified ? '✓ User Verified' : '○ User Pending'}
                    </Text>
                </View>

                {item.payoutReleased && (
                    <View style={styles.payoutBadge}>
                        <Text style={styles.payoutText}>💰 Payout Released to Wallet</Text>
                    </View>
                )}

                {item.status === 'completed' && !item.payoutReleased && (
                    <View style={styles.otpInputContainer}>
                        <Text style={styles.otpInputTitle}>🔑 Enter Customer OTP</Text>
                        <Text style={styles.otpInputDesc}>
                            Ask the customer for the 4-digit code shown on their screen to release the escrow payout.
                        </Text>
                        <View style={styles.otpRow}>
                            <TextInput
                                style={styles.otpTextInput}
                                placeholder="4-Digit OTP"
                                placeholderTextColor="#9ca3af"
                                keyboardType="number-pad"
                                maxLength={4}
                                value={otpInputs[item._id] || ''}
                                onChangeText={(val) => setOtpInputs(prev => ({ ...prev, [item._id]: val }))}
                            />
                            <TouchableOpacity
                                style={[styles.otpSubmitBtn, (!otpInputs[item._id] || otpInputs[item._id].length !== 4) && { opacity: 0.6 }]}
                                disabled={!otpInputs[item._id] || otpInputs[item._id].length !== 4 || isSubmittingOtp[item._id]}
                                onPress={() => handleVerifyOtp(item._id)}
                            >
                                {isSubmittingOtp[item._id] ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.otpSubmitBtnText}>Verify & Payout</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {item.status === 'pending' && (
                    <View style={styles.actionsBox}>
                        <TouchableOpacity
                            style={styles.acceptActionBtn}
                            onPress={() => updateStatus(item._id, 'confirmed')}
                        >
                            <Text style={styles.acceptBtnLabel}>✓ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.rejectActionBtn}
                            onPress={() => updateStatus(item._id, 'rejected')}
                        >
                            <Text style={styles.rejectBtnLabel}>✗ Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.status === 'confirmed' && (
                    <View style={styles.actionsBox}>
                        <TouchableOpacity
                            style={styles.completeActionBtn}
                            onPress={() => handleVerifyAndComplete(item._id)}
                        >
                            <Text style={styles.completeBtnLabel}>📸 AI Verify & Complete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.chatActionBtn}
                            onPress={() => navigation.navigate('ChatScreen', {
                                bookingId: item._id,
                                receiverName: item.userId?.name || 'Customer',
                                receiverPhone: item.userId?.phone,
                                senderId: user?.id
                            })}
                        >
                            <Text style={styles.chatBtnLabel}>💬 Chat</Text>
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
                    <Text style={styles.headerTitleText}>Service Requests</Text>
                    <Text style={styles.headerSubText}>Manage your workflow</Text>
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
    container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 15,
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: { color: '#111827', fontSize: 16, fontFamily: 'Inter_700Bold' },
    headerTitleText: { color: '#111827', fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    headerSubText: { color: '#6b7280', fontSize: 15, marginTop: 2, fontFamily: 'Inter_600SemiBold' },
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
    cardTitle: { color: '#111827', fontSize: 20, fontFamily: 'Inter_800ExtraBold', flex: 1, marginRight: 10, letterSpacing: -0.2 },
    badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
    cardInfo: { color: '#6b7280', fontSize: 15, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
    actionsBox: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 20,
    },
    acceptActionBtn: {
        flex: 1, backgroundColor: '#f0fdf4',
        borderRadius: 14, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: '#bbf7d0',
    },
    acceptBtnLabel: { color: '#16a34a', fontFamily: 'Inter_700Bold', fontSize: 15 },
    rejectActionBtn: {
        flex: 1, backgroundColor: '#fef2f2',
        borderRadius: 14, padding: 16, alignItems: 'center',
    },
    rejectBtnLabel: { color: '#dc2626', fontFamily: 'Inter_700Bold', fontSize: 15 },
    completeActionBtn: {
        flex: 1.5, backgroundColor: '#2563eb',
        borderRadius: 14, padding: 16, alignItems: 'center',
    },
    completeBtnLabel: { color: '#ffffff', fontFamily: 'Inter_800ExtraBold', fontSize: 14 },
    chatActionBtn: {
        flex: 1, backgroundColor: '#f9fafb',
        borderRadius: 14, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    chatBtnLabel: { color: '#111827', fontFamily: 'Inter_700Bold', fontSize: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 20 },
    emptyText: { color: '#111827', fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    emptyHint: { color: '#6b7280', fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter_500Medium' },

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
        fontFamily: 'Inter_700Bold',
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
    },
    verificationRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 8
    },
    verifBadge: {
        fontSize: 11,
        fontFamily: 'Inter_700Bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden'
    },
    verifSuccess: {
        backgroundColor: '#f0fdf4',
        color: '#16a34a'
    },
    verifPending: {
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    payoutBadge: {
        backgroundColor: '#eff6ff',
        padding: 10,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        alignItems: 'center'
    },
    payoutText: {
        color: '#2563eb',
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 13
    },
    otpInputContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    otpInputTitle: {
        color: '#1e293b',
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 15,
        marginBottom: 6,
    },
    otpInputDesc: {
        color: '#64748b',
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        lineHeight: 18,
        marginBottom: 12,
    },
    otpRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    otpTextInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: '#0f172a',
        textAlign: 'center',
        letterSpacing: 4,
    },
    otpSubmitBtn: {
        backgroundColor: '#10b981',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpSubmitBtnText: {
        color: '#ffffff',
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 14,
    },
});
