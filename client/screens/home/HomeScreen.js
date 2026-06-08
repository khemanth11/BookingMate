import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, SafeAreaView, Platform,
    FlatList, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/config';


const CATEGORIES = [
    { id: '1', name: 'Farm Animals', icon: '🐄', desc: 'Buffalo, Cow, Goat, Vet', color: '#764040' },
    { id: '2', name: 'Medical', icon: '💊', desc: 'Clinics & Medicine Delivery', color: '#1a1a5e' },
    { id: '3', name: 'Farm Equipment', icon: '🚜', desc: 'Tractors, Harvesters, Tools', color: '#5e3a1a' },
    { id: '4', name: 'Farm Labor', icon: '👨‍🌾', desc: 'Daily labor & sowing help', color: '#4a1a5e' },
    { id: '5', name: 'Water Supply', icon: '💧', desc: 'Water tankers & irrigation', color: '#1a4a5e' },
    { id: '6', name: 'Seeds & Crops', icon: '🌾', desc: 'Buy/sell seeds & pesticides', color: '#5e4a1a' },
    { id: '7', name: 'Plumbing', icon: '🪠', desc: 'Fixing pipes, taps, and leaks', color: '#2563eb' },
    { id: '8', name: 'Electrical Work', icon: '⚡', desc: 'Wiring, fixtures, and repairs', color: '#d97706' },
    { id: '9', name: 'Carpentry', icon: '🪓', desc: 'Furniture build & repairs', color: '#b45309' },
    { id: '10', name: 'Education & Tutoring', icon: '📚', desc: 'Local teachers & classes', color: '#4f46e5' },
    { id: '11', name: 'Construction & Masonry', icon: '🧱', desc: 'Brickwork, cement & plastering', color: '#475569' },
    { id: '12', name: 'Transport & Logistics', icon: '🚚', desc: 'Goods loading & delivery', color: '#0891b2' },
    { id: '13', name: 'Cleaning & Housekeeping', icon: '🧹', desc: 'Home, office & yard cleaning', color: '#0d9488' },
    { id: '14', name: 'Home Appliance Repair', icon: '🔧', desc: 'TV, fridge, and fan service', color: '#4f46e5' }
];

export default function HomeScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const [listings, setListings] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const fetchRecommendations = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BASE_URL}/api/listings/recommendations`, {
                headers: { 'x-auth-token': token }
            });
            setRecommendations(res.data);
        } catch (err) {
            console.error('Recommendations Fetch Error:', err);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchRecommendations();
        }, [])
    );

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
                    <View style={styles.headerInfo}>
                        <Text style={styles.welcomeText}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{user?.name || 'Local User'} 👋</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => changeLanguage(language === 'en' ? 'hi' : 'en')}
                            style={styles.langBtn}
                        >
                            <Text style={styles.langBtnText}>{language === 'en' ? 'हिन्दी' : 'EN'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutBtn}
                        >
                            <Text style={styles.logoutIcon}>🚪</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search / Action Bar */}
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() => navigation.navigate('SearchScreen')}
                >
                    <Text style={styles.searchIcon}>🔍</Text>
                    <Text style={styles.searchText}>{t('search_hint')}</Text>
                </TouchableOpacity>

                {/* Platform Trust Ribbon */}
                <View style={styles.trustRibbonContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustRibbonScroll}>
                        <View style={styles.trustItem}>
                            <Text style={styles.trustIcon}>🛡️</Text>
                            <Text style={styles.trustText}>100% Safe Payments</Text>
                        </View>
                        <View style={styles.trustDivider} />
                        <View style={styles.trustItem}>
                            <Text style={styles.trustIcon}>🤖</Text>
                            <Text style={styles.trustText}>AI-Verified Work</Text>
                        </View>
                        <View style={styles.trustDivider} />
                        <View style={styles.trustItem}>
                            <Text style={styles.trustIcon}>🤝</Text>
                            <Text style={styles.trustText}>Top Local Experts</Text>
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.quickActionsRow}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('ConsumerBookings')}
                    >
                        <Text style={styles.quickActionIcon}>📅</Text>
                        <Text style={styles.quickActionText}>{t('my_bookings')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('MapScreen')}
                    >
                        <Text style={styles.quickActionIcon}>🗺️</Text>
                        <Text style={styles.quickActionText}>{t('map')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('FavoritesScreen')}
                    >
                        <Text style={styles.quickActionIcon}>❤️</Text>
                        <Text style={styles.quickActionText}>{t('wishlist')}</Text>
                    </TouchableOpacity>
                </View>



                {/* Categories Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('categories')}</Text>
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
        backgroundColor: '#f8fafc',
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
    headerInfo: {
        flex: 1
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    langBtn: {
        marginRight: 15,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    langBtnText: {
        fontSize: 13,
        fontFamily: 'Inter_700Bold',
        color: '#111827'
    },
    welcomeText: {
        color: '#6b7280',
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        marginBottom: 2
    },
    userName: {
        fontSize: 28,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    logoutBtn: {
        backgroundColor: '#ffffff',
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    logoutIcon: {
        fontSize: 18,
    },
    tagline: {
        fontSize: 14,
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
        fontFamily: 'Inter_500Medium',
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 12,
        gap: 12,
    },
    quickActionBtn: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickActionIcon: {
        fontSize: 20,
        marginBottom: 8,
    },
    quickActionText: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#111827',
        fontSize: 22,
        fontFamily: 'Inter_800ExtraBold',
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'Inter_500Medium',
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
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        marginBottom: 14,
    },
    cardIcon: {
        fontSize: 24,
    },
    cardName: {
        color: '#111827',
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 15,
        marginBottom: 6,
    },
    cardDesc: {
        color: '#6b7280',
        fontSize: 12,
        lineHeight: 18,
        fontFamily: 'Inter_400Regular',
    },
    recContainer: {
        marginBottom: 32,
    },
    recList: {
        paddingRight: 20,
    },
    recCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        width: 240,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    recName: {
        fontSize: 18,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    recProviderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    recProvider: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Inter_500Medium',
    },
    recVerified: {
        fontSize: 12,
        marginLeft: 6,
    },
    recFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    recPrice: {
        fontSize: 18,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
    },
    recRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recRatingStar: {
        fontSize: 14,
        color: '#f59e0b',
        marginRight: 4,
    },
    recRatingText: {
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
        color: '#111827',
    },
    trustRibbonContainer: {
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        paddingVertical: 10,
    },
    trustRibbonScroll: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 16,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustIcon: {
        fontSize: 14,
    },
    trustText: {
        fontSize: 12,
        color: '#475569',
        fontFamily: 'Inter_700Bold',
    },
    trustDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#cbd5e1',
    },
});