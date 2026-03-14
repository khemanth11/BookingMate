import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, SafeAreaView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';


const CATEGORIES = [
    { id: '1', name: 'Farm Animals', icon: '🐄', desc: 'Buffalo, Cow, Goat', color: '#764040ff' },
    { id: '2', name: 'Medical', icon: '💊', desc: 'Medicine delivery nearby', color: '#1a1a5e' },
    { id: '3', name: 'Farm Equipment', icon: '🚜', desc: 'Tractor, Tools', color: '#5e3a1a' },
    { id: '4', name: 'Farm Labor', icon: '👨‍🌾', desc: 'Daily workers', color: '#4a1a5e' },
    { id: '5', name: 'Water Supply', icon: '💧', desc: 'Water tanker delivery', color: '#1a4a5e' },
    { id: '6', name: 'Seeds & Crops', icon: '🌾', desc: 'Buy/sell seeds', color: '#5e4a1a' },
];

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.subGreeting}>Good Morning 👋</Text>
                        <Text style={styles.greeting}>
                            {user?.name ? user.name : 'Welcome back!'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
                        <Text style={styles.profileInitials}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search / Action Bar */}
                <TouchableOpacity
                    style={styles.actionContainer}
                    onPress={() => navigation.navigate('SearchScreen')}
                >
                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon}>✨</Text>
                        <Text style={styles.searchText}>Try: "I need a plumber for my sink"</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.quickActionsRow}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('ConsumerBookings')}
                    >
                        <Text style={styles.quickActionText}>📅 Bookings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#2d6a4f' }]}
                        onPress={() => navigation.navigate('MapScreen')}
                    >
                        <Text style={[styles.quickActionText, { color: '#f8f9fa' }]}>🗺️ Map</Text>
                    </TouchableOpacity>
                </View>

                {/* Categories Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Browse Services</Text>
                    <Text style={styles.sectionSubtitle}>Find reliable help nearby</Text>
                </View>

                <View style={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => navigation.navigate('CategoryListing', { category: cat })}
                        >
                            <View style={[styles.iconContainer]}>
                                <Text style={styles.cardIcon}>{cat.icon}</Text>
                            </View>
                            <Text style={styles.cardName}>{cat.name}</Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>{cat.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10, // Added margin as requested by user
        marginBottom: 24,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.5,
    },
    subGreeting: {
        fontSize: 19,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    profileBtn: {
        backgroundColor: '#ffffff',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    profileInitials: {
        color: '#111827',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionContainer: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 12,
        opacity: 0.7,
    },
    searchText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    quickActionBtn: {
        flex: 1,
        backgroundColor: '#111827',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    quickActionText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    sectionSubtitle: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 14,
    },
    card: {
        width: '47.5%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 14,
    },
    cardIcon: {
        fontSize: 24,
    },
    cardName: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 6,
    },
    cardDesc: {
        color: '#6b7280',
        fontSize: 13,
        lineHeight: 18,
    },
});