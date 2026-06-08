import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, Platform
} from 'react-native';
import { useProvider } from './ProviderContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/config';

export default function ProviderDashboardScreen() {
    const { listings, deleteListing } = useProvider();
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [stats, setStats] = React.useState({
        totalBookings: 0,
        completed: 0,
        totalEarnings: 0
    });
    const [wallet, setWallet] = React.useState({ balance: 0 });

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/bookings/stats`, {
                headers: { 'x-auth-token': token }
            });
            setStats(res.data);

            const walletRes = await axios.get(`${BASE_URL}/api/wallet`, {
                headers: { 'x-auth-token': token }
            });
            setWallet(walletRes.data);
        } catch (err) {
            console.error('Fetch Stats/Wallet Error:', err);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchStats();
        }, [])
    );

    const handleDelete = (id, name) => {
        Alert.alert(
            'Delete Listing',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteListing(id) },
            ]
        );
    };

    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: item.available ? '#1a472a' : '#5e1a1a' }]}>
                    <Text style={styles.badgeText}>{item.available ? '✅ Available' : '❌ Unavailable'}</Text>
                </View>
            </View>
            <Text style={styles.cardInfo}>📂 {item.category}</Text>
            <Text style={styles.cardInfo}>💰 {item.price}</Text>
            {item.description ? (
                <Text style={styles.cardDesc}>{item.description}</Text>
            ) : null}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditListing', { listingId: item.id })}
                >
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitleText}>Workspace</Text>
                    {/* <Text style={styles.headerSubText}>Manage your professional services</Text> */}
                </View>
                <View style={styles.topActionsRow}>
                    <TouchableOpacity
                        style={styles.bookingsActionBtn}
                        onPress={() => navigation.navigate('ProviderBookings')}
                    >
                        <Text style={styles.bookingsActionText}>Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutActionBtn} onPress={handleLogout}>
                        <Text style={styles.logoutActionText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => navigation.navigate('WalletScreen')}
                >
                    <Text style={styles.statNum}>₹{wallet.balance}</Text>
                    <Text style={styles.statLabel}>Wallet Balance</Text>
                </TouchableOpacity>
                <View style={[styles.statCard, { borderColor: '#1a472a' }]}>
                    <Text style={[styles.statNum, { color: '#1a472a' }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Jobs Done</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{listings.length}</Text>
                    <Text style={styles.statLabel}>Listings</Text>
                </View>
            </View>

            <View style={styles.sectionHeaderView}>
                <Text style={styles.sectionTitleText}>Service Portfolio</Text>
                <Text style={styles.sectionSubText}>Optimize availability & earnings</Text>
            </View>

            <FlatList
                data={listings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainerView}>
                        <View style={styles.emptyIconBoxView}>
                            <Text style={styles.emptyIconText}>📋</Text>
                        </View>
                        <Text style={styles.emptyTitleText}>No services active</Text>
                        <Text style={styles.emptyHintText}>Tap the + button to launch your professional offering.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 120 }}
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddListing')}>
                <Text style={styles.fabIcon}>＋</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: 32,
    },
    headerTitleText: {
        color: '#111827',
        fontSize: 28,
        fontFamily: 'Inter_800ExtraBold',
        letterSpacing: -0.5
    },
    headerSubText: {
        color: '#6b7280',
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        marginTop: 2
    },
    topActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    bookingsActionBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    bookingsActionText: {
        color: '#ffffff',
        fontFamily: 'Inter_700Bold',
        fontSize: 13
    },
    logoutActionBtn: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    logoutActionText: {
        color: '#ef4444',
        fontFamily: 'Inter_700Bold',
        fontSize: 13
    },
    statsRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 32
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    statNum: { color: '#111827', fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    statLabel: { color: '#6b7280', fontSize: 13, marginTop: 4, fontFamily: 'Inter_700Bold' },
    sectionHeaderView: { marginBottom: 20 },
    sectionTitleText: { color: '#111827', fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    sectionSubText: { color: '#6b7280', fontSize: 15, marginTop: 4, fontFamily: 'Inter_500Medium' },
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
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
    cardTitle: {
        color: '#111827',
        fontSize: 20,
        fontFamily: 'Inter_800ExtraBold',
        flex: 1,
        marginRight: 10,
        letterSpacing: -0.2
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5, textTransform: 'uppercase' },
    cardInfo: { color: '#6b7280', fontSize: 15, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
    cardDesc: { color: '#9ca3af', fontSize: 14, fontStyle: 'italic', marginTop: 8, lineHeight: 22, fontFamily: 'Inter_500Medium' },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 20
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    editBtnText: { color: '#111827', fontFamily: 'Inter_700Bold', fontSize: 15 },
    deleteBtn: {
        flex: 1,
        backgroundColor: '#fef2f2',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    deleteBtnText: { color: '#dc2626', fontFamily: 'Inter_700Bold', fontSize: 15 },
    emptyContainerView: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBoxView: {
        backgroundColor: '#f9fafb',
        width: 100, height: 100,
        borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    emptyIconText: { fontSize: 44 },
    emptyTitleText: { color: '#111827', fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    emptyHintText: { color: '#6b7280', fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 24, fontFamily: 'Inter_500Medium' },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 40,
        backgroundColor: '#2563eb',
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: { color: '#ffffff', fontSize: 36, fontWeight: '400' },
});
