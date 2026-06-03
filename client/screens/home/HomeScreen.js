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
    { id: '1', name: 'Farm Animals', icon: '🐄', desc: 'Buffalo, Cow, Goat', color: '#764040ff' },
    { id: '2', name: 'Medical', icon: '💊', desc: 'Medicine delivery nearby', color: '#1a1a5e' },
    { id: '3', name: 'Farm Equipment', icon: '🚜', desc: 'Tractor, Tools', color: '#5e3a1a' },
    { id: '4', name: 'Farm Labor', icon: '👨‍🌾', desc: 'Daily workers', color: '#4a1a5e' },
    { id: '5', name: 'Water Supply', icon: '💧', desc: 'Water tanker delivery', color: '#1a4a5e' },
    { id: '6', name: 'Seeds & Crops', icon: '🌾', desc: 'Buy/sell seeds', color: '#5e4a1a' },
];

export default function HomeScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const [listings, setListings] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

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
                        {/* <Text style={styles.welcomeText}>{t('welcome')},</Text> */}
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

                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                    <View style={styles.recContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>💡 {t('Suggestions') || 'Suggested for You'}</Text>
                            {/* <Text style={styles.sectionSubtitle}>AI-powered picks for your needs</Text> */}
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={recommendations}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.recCard}
                                    onPress={() => navigation.navigate('ListingDetail', { listing: item, category: { name: item.category, icon: '✨' } })}
                                >
                                    <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.recProviderRow}>
                                        <Text style={styles.recProvider} numberOfLines={1}>{item.providerId?.name || 'Local Expert'}</Text>
                                        {item.providerId?.isVerified && <Text style={styles.recVerified}>✅</Text>}
                                    </View>
                                    
                                    <View style={styles.recFooter}>
                                        <Text style={styles.recPrice}>₹{item.price}</Text>
                                        <View style={styles.recRatingRow}>
                                            <Text style={styles.recRatingStar}>★</Text>
                                            <Text style={styles.recRatingText}>{item.averageRating?.toFixed(1) || 'New'}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.recList}
                        />
                    </View>
                )}

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
});