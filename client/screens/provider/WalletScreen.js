import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal, TextInput
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.113.112.195:5000/api/wallet';

export default function WalletScreen() {
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();

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

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleWithdraw = async () => {
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
        marginBottom: 32,
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
    modalContent: { backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
    modalSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    input: {
        width: '100%', backgroundColor: '#f8fafc',
        borderRadius: 16, padding: 16, fontSize: 20, fontWeight: '800',
        textAlign: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    confirmBtn: { backgroundColor: '#0f172a', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 16 },
    confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    cancelText: { color: '#64748b', fontSize: 15, fontWeight: '600' }
});
