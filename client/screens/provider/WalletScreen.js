import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { BASE_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

const API_URL = `${BASE_URL}/api/wallet`;

export default function WalletScreen() {
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();

    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [kycModalVisible, setKycModalVisible] = useState(false);
    
    // Bank form fields
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upiId, setUpiId] = useState('');
    
    // KYC document fields
    const [idType, setIdType] = useState('Aadhaar');
    const [kycBase64, setKycBase64] = useState('');

    const isLocked = profile?.kycDocument?.status === 'verified' || profile?.kycDocument?.status === 'pending';

    const fetchWallet = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(API_URL, {
                headers: { 'x-auth-token': token }
            });
            setWallet(res.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/auth/profile/${user.id}`, {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
            
            // Set initial state from existing details if they exist
            if (res.data.bankDetails) {
                setAccountHolderName(res.data.bankDetails.accountHolderName || '');
                setAccountNumber(res.data.bankDetails.accountNumber || '');
                setIfscCode(res.data.bankDetails.ifscCode || '');
                setUpiId(res.data.bankDetails.upiId || '');
            }
            if (res.data.kycDocument) {
                setIdType(res.data.kycDocument.idType || 'Aadhaar');
                setKycBase64(res.data.kycDocument.base64Data || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        fetchWallet();
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const handleWithdraw = async () => {
        if (!profile?.kycDocument || profile?.kycDocument?.status !== 'verified') {
            Alert.alert('KYC Required', 'You must verify your KYC identity in Account Settings before initiating withdrawals.');
            return;
        }

        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }

        if (parseFloat(withdrawAmount) > wallet.balance) {
            Alert.alert('Error', 'Insufficient balance.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/withdraw`, 
                { amount: parseFloat(withdrawAmount) },
                { headers: { 'x-auth-token': token } }
            );
            Alert.alert('Success', 'Withdrawal request submitted! Funds will be processed soon.');
            setWithdrawModalVisible(false);
            setWithdrawAmount('');
            fetchWallet();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Withdrawal failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBankDetails = async () => {
        if (!upiId && (!accountNumber || !ifscCode || !accountHolderName)) {
            Alert.alert('Error', 'Please enter UPI ID or complete Bank Account Details.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${BASE_URL}/api/auth/bank-details`, {
                accountNumber,
                ifscCode,
                accountHolderName,
                upiId
            }, {
                headers: { 'x-auth-token': token }
            });
            Alert.alert('Success', 'Bank details updated successfully!');
            fetchProfile();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update bank details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCaptureIdCard = () => {
        // Simulated base64 ID card document
        const mockBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWAQMAAACc1S9bAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAADBJREFUeN7twQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBwPoAAF5y6Y7AAAAAElFTkSuQmCC`;
        setKycBase64(mockBase64);
        Alert.alert('Mock Capture', 'Simulated ID Card photo captured successfully!');
    };

    const handleSubmitKyc = async () => {
        if (!kycBase64) {
            Alert.alert('Error', 'Please capture your ID Card first.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${BASE_URL}/api/auth/kyc-document`, {
                idType,
                base64Data: kycBase64
            }, {
                headers: { 'x-auth-token': token }
            });
            Alert.alert('Success', 'KYC document submitted for verification!');
            fetchProfile();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'KYC submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.txCard}>
            <View style={styles.txIconBox}>
                <Text style={styles.txIcon}>{item.type === 'credit' ? '💰' : '💸'}</Text>
            </View>
            <View style={styles.txInfo}>
                <Text style={styles.txTitle}>
                    {item.type === 'credit' ? 'Booking Earnings' : 'Withdrawal Request'}
                </Text>
                <Text style={styles.txDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
            <View style={styles.txAmountBox}>
                <Text style={[styles.txAmount, { color: item.type === 'credit' ? '#16a34a' : '#dc2626' }]}>
                    {item.type === 'credit' ? '+' : '-'}₹{item.amount}
                </Text>
                <Text style={styles.txStatus}>{item.status.toUpperCase()}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} />
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <Text style={styles.balanceAmount}>₹{wallet?.balance || 0}</Text>
                        <TouchableOpacity 
                            style={styles.withdrawBtn}
                            onPress={() => setWithdrawModalVisible(true)}
                        >
                            <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Account & KYC Settings Button */}
                    <TouchableOpacity 
                        style={styles.kycBtn}
                        onPress={() => setKycModalVisible(true)}
                    >
                        <Text style={styles.kycBtnText}>⚙️ Payout Accounts & KYC</Text>
                        {profile?.kycDocument?.status === 'verified' && (
                            <Text style={styles.kycStatusBadgeVerified}>Verified ✅</Text>
                        )}
                        {profile?.kycDocument?.status === 'pending' && (
                            <Text style={styles.kycStatusBadgePending}>Pending ⏳</Text>
                        )}
                        {profile?.kycDocument?.status === 'rejected' && (
                            <Text style={styles.kycStatusBadgeRejected}>Rejected ❌</Text>
                        )}
                        {(profile?.kycDocument?.status === 'none' || !profile?.kycDocument?.status) && (
                            <Text style={styles.kycStatusBadgeNone}>Not Set ⚠️</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    <FlatList
                        data={wallet?.transactions || []}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderTransaction}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>No transactions yet.</Text>
                            </View>
                        }
                    />
                </View>
            )}

            <Modal visible={withdrawModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Withdraw Funds</Text>
                        <Text style={styles.modalSub}>Enter amount to transfer to your linked account</Text>
                        
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Amount (₹)"
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                        />

                        <TouchableOpacity 
                            style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleWithdraw}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Account & KYC Modal */}
            <Modal visible={kycModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '85%', padding: 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Accounts & KYC</Text>
                            <Text style={styles.modalSubText}>Manage your payout destination and verify identity</Text>
                        </View>

                        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Bank Account Section */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionHeader}>Bank Account Details</Text>
                                
                                <Text style={styles.inputLabel}>UPI ID</Text>
                                <TextInput
                                    style={styles.smallInput}
                                    placeholder="e.g. name@okhdfcbank"
                                    value={upiId}
                                    onChangeText={setUpiId}
                                    editable={!isLocked}
                                />

                                <Text style={styles.inputLabel}>Account Holder Name</Text>
                                <TextInput
                                    style={styles.smallInput}
                                    placeholder="e.g. John Doe"
                                    value={accountHolderName}
                                    onChangeText={setAccountHolderName}
                                    editable={!isLocked}
                                />

                                <Text style={styles.inputLabel}>Account Number</Text>
                                <TextInput
                                    style={styles.smallInput}
                                    keyboardType="numeric"
                                    placeholder="e.g. 1234567890"
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    editable={!isLocked}
                                />

                                <Text style={styles.inputLabel}>IFSC Code</Text>
                                <TextInput
                                    style={styles.smallInput}
                                    placeholder="e.g. HDFC0001234"
                                    autoCapitalize="characters"
                                    value={ifscCode}
                                    onChangeText={setIfscCode}
                                    editable={!isLocked}
                                />

                                {!isLocked && (
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                                        onPress={handleUpdateBankDetails}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Bank Details</Text>}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* KYC Verification Section */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionHeader}>Identity Verification (KYC)</Text>
                                
                                {/* Status Banner */}
                                {profile?.kycDocument?.status === 'verified' && (
                                    <Text style={[styles.statusTextBanner, { backgroundColor: '#dcfce7', color: '#15803d' }]}>
                                        Your identity has been verified successfully. ✅
                                    </Text>
                                )}
                                {profile?.kycDocument?.status === 'pending' && (
                                    <Text style={[styles.statusTextBanner, { backgroundColor: '#fef3c7', color: '#b45309' }]}>
                                        KYC document is under manual review. ⏳
                                    </Text>
                                )}
                                {profile?.kycDocument?.status === 'rejected' && (
                                    <Text style={[styles.statusTextBanner, { backgroundColor: '#fee2e2', color: '#b91c1c' }]}>
                                        KYC rejected. Please re-upload a clear document. ❌
                                    </Text>
                                )}
                                {(profile?.kycDocument?.status === 'none' || !profile?.kycDocument?.status) && (
                                    <Text style={[styles.statusTextBanner, { backgroundColor: '#f1f5f9', color: '#475569' }]}>
                                        Please complete KYC to unlock payout withdrawals. ⚠️
                                    </Text>
                                )}

                                {!isLocked && (
                                    <>
                                        <Text style={styles.inputLabel}>Select ID Document Type</Text>
                                        <View style={styles.docTypeRow}>
                                            {['Aadhaar', 'PAN Card', 'Driving License', 'Passport'].map((type) => (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[styles.docTypeTag, idType === type && styles.docTypeTagSelected]}
                                                    onPress={() => setIdType(type)}
                                                >
                                                    <Text style={[styles.docTypeTagText, idType === type && styles.docTypeTagTextSelected]}>
                                                        {type}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <TouchableOpacity 
                                            style={styles.captureBtn}
                                            onPress={handleCaptureIdCard}
                                        >
                                            <Text style={styles.captureBtnText}>📷 Capture ID Card Photo</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {kycBase64 ? (
                                    <View style={styles.previewBox}>
                                        <Image source={{ uri: kycBase64 }} style={styles.previewImage} />
                                    </View>
                                ) : null}

                                {!isLocked && (
                                    <TouchableOpacity 
                                        style={[styles.kycSubmitBtn, !kycBase64 && styles.kycSubmitBtnDisabled, isSubmitting && { opacity: 0.7 }]}
                                        onPress={handleSubmitKyc}
                                        disabled={!kycBase64 || isSubmitting}
                                    >
                                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.kycSubmitBtnText}>Submit KYC for Approval</Text>}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setKycModalVisible(false)}>
                            <Text style={styles.cancelText}>Close Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
    backBtn: { marginRight: 15, padding: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    backIcon: { fontSize: 18, color: '#0f172a', fontWeight: 'bold' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    balanceCard: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 15, elevation: 10,
    },
    balanceLabel: { color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 8 },
    balanceAmount: { color: '#ffffff', fontSize: 48, fontWeight: '900', marginBottom: 24 },
    withdrawBtn: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    withdrawBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
    kycBtn: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
    },
    kycBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a'
    },
    kycStatusBadgeVerified: {
        fontSize: 12,
        fontWeight: '800',
        color: '#16a34a',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    kycStatusBadgePending: {
        fontSize: 12,
        fontWeight: '800',
        color: '#d97706',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    kycStatusBadgeRejected: {
        fontSize: 12,
        fontWeight: '800',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    kycStatusBadgeNone: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20, letterSpacing: -0.4 },
    txCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    txIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    txIcon: { fontSize: 20 },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    txDate: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    txAmountBox: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    txStatus: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center', width: '100%' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
    modalSubText: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
    modalSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    input: {
        width: '100%', backgroundColor: '#f8fafc',
        borderRadius: 16, padding: 16, fontSize: 20, fontWeight: '800',
        textAlign: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    confirmBtn: { backgroundColor: '#0f172a', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 16 },
    confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    cancelText: { color: '#64748b', fontSize: 15, fontWeight: '600', textAlign: 'center' },
    // Scroll content
    scrollContent: {
        paddingBottom: 40
    },
    modalHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    sectionContainer: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 6,
        marginTop: 12
    },
    smallInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '600'
    },
    saveBtn: {
        backgroundColor: '#0f172a',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 16
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14
    },
    statusTextBanner: {
        fontSize: 13,
        fontWeight: '700',
        padding: 12,
        borderRadius: 12,
        textAlign: 'center',
        marginBottom: 16
    },
    docTypeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    docTypeTag: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    docTypeTagSelected: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a'
    },
    docTypeTagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },
    docTypeTagTextSelected: {
        color: '#fff'
    },
    captureBtn: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 16
    },
    captureBtnText: {
        color: '#0f172a',
        fontWeight: '700',
        fontSize: 14
    },
    previewBox: {
        width: '100%',
        height: 120,
        backgroundColor: '#e2e8f0',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden'
    },
    previewImage: {
        width: '100%',
        height: '100%'
    },
    kycSubmitBtn: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center'
    },
    kycSubmitBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14
    },
    kycSubmitBtnDisabled: {
        backgroundColor: '#94a3b8'
    }
});
