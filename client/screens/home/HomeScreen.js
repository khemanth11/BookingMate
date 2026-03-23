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
            const res = await axios.get('http://10.113.112.195:5000/api/listings/recommendations', {
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
                        style={[styles.quickActionBtn, { backgroundColor: '#1c3144' }]}
                        onPress={() => navigation.navigate('ConsumerBookings')}
                    >
                        <Text style={[styles.quickActionText, { color: '#f8f9fa' }]}>{t('my_bookings')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#2d6a4f' }]}
                        onPress={() => navigation.navigate('MapScreen')}
                    >
                        <Text style={[styles.quickActionText, { color: '#f8f9fa' }]}>🗺️ {t('map')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: '#b5838d' }]}
                        onPress={() => navigation.navigate('FavoritesScreen')}
                    >
                        <Text style={[styles.quickActionText, { color: '#f8f9fa' }]}>❤️ {t('wishlist')}</Text>
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
                                    <View style={styles.recHeader}>
                                        <View style={styles.recPriceTag}>
                                            <Text style={styles.recPrice}>₹{item.price}</Text>
                                        </View>
                                        <Text style={styles.recRating}>★ {item.averageRating?.toFixed(1) || 'New'}</Text>
                                    </View>
                                    <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.recFooter}>
                                        <Text style={styles.recProvider} numberOfLines={1}>👤 {item.providerId?.name || 'Expert'}</Text>
                                        {item.providerId?.isVerified && <Text style={styles.recVerified}>✅</Text>}
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
        fontWeight: 'bold',
        color: '#111827'
    },
    welcomeText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    logoutBtn: {
        backgroundColor: '#fee2e2',
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
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
        fontWeight: '500',
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
    recContainer: {
        marginBottom: 32,
    },
    recList: {
        paddingRight: 20,
    },
    recCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        width: 200,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    recHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recPriceTag: {
        backgroundColor: '#111827',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    recPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#ffffff',
    },
    recRating: {
        fontSize: 13,
        fontWeight: '700',
        color: '#f59e0b',
    },
    recName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    recFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    recProvider: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
        flex: 1,
    },
    recVerified: {
        fontSize: 12,
        marginLeft: 4,
    },
});