import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.113.112.195:5000/api/auth/favorites';

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(API_URL, {
                headers: { 'x-auth-token': token }
            });
            setFavorites(res.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFavorites();
        });
        return unsubscribe;
    }, [navigation]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.favoriteCard}
            onPress={() => navigation.navigate('ListingDetail', { 
                listing: item, 
                category: { icon: '⭐', name: item.category } 
            })}
        >
            <View style={styles.cardMain}>
                <View style={styles.cardInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.providerRow}>
                        <Text style={styles.providerText}>👤 {item.providerId?.name || 'Expert'}</Text>
                        {item.providerId?.isVerified && (
                            <Text style={styles.verifiedIcon}>✅</Text>
                        )}
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>₹{item.price}</Text>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                    <Text style={styles.headerSub}>Services you liked</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#111827" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>❤️</Text>
                            <Text style={styles.emptyText}>Your wishlist is empty</Text>
                            <Text style={styles.emptyHint}>Save your favorite services to find them easily later.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6f8', paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    backBtn: { marginRight: 15, padding: 8, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
    backIcon: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerSub: { color: '#64748b', fontSize: 15, marginTop: 2, fontWeight: '600' },
    favoriteCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    cardInfo: { flex: 1 },
    itemName: { color: '#0f172a', fontWeight: '800', fontSize: 20, marginBottom: 6, letterSpacing: -0.4 },
    providerRow: { flexDirection: 'row', alignItems: 'center' },
    providerText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    verifiedIcon: { marginLeft: 4, fontSize: 12 },
    priceContainer: { alignItems: 'flex-end' },
    priceValue: { color: '#0f172a', fontWeight: '900', fontSize: 20, marginBottom: 6 },
    categoryBadge: { 
        backgroundColor: '#f1f5f9', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    categoryBadgeText: { 
        fontSize: 10, 
        color: '#64748b', 
        textTransform: 'uppercase', 
        fontWeight: '800' 
    },
    emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 20 },
    emptyText: { color: '#0f172a', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    emptyHint: { color: '#64748b', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '500' },
});
