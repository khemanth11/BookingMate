import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Alert, Platform
} from 'react-native';
import { useProvider } from './ProviderContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export default function ProviderDashboardScreen() {
    const { listings, deleteListing } = useProvider();
    const navigation = useNavigation();
    const { user, logout } = useAuth();

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
            <Text style={styles.cardInfo}>💰 ₹{item.price}</Text>
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
                    <Text style={styles.headerTitle}>Workspace</Text>
                    {/* <Text style={styles.headerSub}>
                        {user?.name || user?.email || 'Provider'} Dashboard
                    </Text> */}
                </View>
                <View style={styles.topActions}>
                    <TouchableOpacity
                        style={styles.bookingsBtn}
                        onPress={() => navigation.navigate('ProviderBookings')}
                    >
                        <Text style={styles.bookingsText}>🔔 Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{listings.length}</Text>
                    <Text style={styles.statLabel}>Total Listings</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{listings.filter(l => l.available).length}</Text>
                    <Text style={styles.statLabel}>Active Status</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Services</Text>
                <Text style={styles.sectionSubtitle}>Manage pricing and availability</Text>
            </View>

            <FlatList
                data={listings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Text style={styles.emptyIcon}>📋</Text>
                        </View>
                        <Text style={styles.emptyText}>No listings yet</Text>
                        <Text style={styles.emptyHint}>Tap the + button below to create your very first service offering.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
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
        backgroundColor: '#f5f6f8',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8, // Increased margin as requested
        marginBottom: 24,
    },
    headerTitle: {
        color: '#111827',
        fontSize: 25,
        fontWeight: '800',
        letterSpacing: -0.5
    },
    headerSub: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
        marginTop: 4
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8
    },
    bookingsBtn: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    bookingsText: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 14
    },
    logoutBtn: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 13
    },
    statsRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 32
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statNum: { color: '#111827', fontSize: 32, fontWeight: '800' },
    statLabel: { color: '#6b7280', fontSize: 14, marginTop: 6, fontWeight: '600' },
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { color: '#111827', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    sectionSubtitle: { color: '#6b7280', fontSize: 15, marginTop: 4 },
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
    cardTitle: {
        color: '#111827',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    cardInfo: { color: '#6b7280', fontSize: 15, marginBottom: 8, fontWeight: '500' },
    cardDesc: { color: '#9ca3af', fontSize: 14, fontStyle: 'italic', marginTop: 6, lineHeight: 22 },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 16
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    editBtnText: { color: '#111827', fontWeight: '700', fontSize: 15 },
    deleteBtn: {
        flex: 1,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    deleteBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyIconBox: {
        backgroundColor: '#ffffff',
        width: 80, height: 80,
        borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    emptyIcon: { fontSize: 36 },
    emptyText: { color: '#111827', fontSize: 24, fontWeight: '800' },
    emptyHint: { color: '#6b7280', fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 24 },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 30,
        backgroundColor: '#111827',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    fabIcon: { color: '#ffffff', fontSize: 32, fontWeight: 'regular' },
});
