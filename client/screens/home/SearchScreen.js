import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/config';

const API_URL = `${BASE_URL}/api/listings`;

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState([]);

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BASE_URL}/api/auth/favorites`, {
                headers: { 'x-auth-token': token }
            });
            setFavoriteIds(res.data.map(f => f._id || f));
        } catch (err) { /* ignore */ }
    };

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFavorites();
        });
        return unsubscribe;
    }, [navigation]);

    const handleToggleFavorite = async (listingId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await axios.post(`${BASE_URL}/api/auth/favorites/${listingId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            setFavoriteIds(res.data);
        } catch (err) {
            console.error('Toggle Favorite Error:', err);
        }
    };

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/semantic-search`, { query });
            setResults(res.data);
        } catch (error) {
            console.error('Search error:', error);
            alert('AI Search is currently unavailable. Ensure backend has Pinecone config.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.searchResultCard}
            onPress={() => navigation.navigate('ListingDetail', { listing: item, category: { name: item.category, icon: '🔍' } })}
        >
            <View style={styles.cardMain}>
                <View style={styles.cardInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <View style={styles.priceBadge}>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => handleToggleFavorite(item._id || item.id)}
                    style={styles.heartAction}
                >
                    <Text style={styles.heartIcon}>
                        {favoriteIds.includes(item._id || item.id) ? '❤️' : '🤍'}
                    </Text>
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>AI Search</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type full sentences (e.g. 'I need a plumber to fix a sink')"
                    placeholderTextColor="#9ca3af"
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    autoFocus
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Search</Text>}
                </TouchableOpacity>
            </View>

            {results.length === 0 && !isLoading && query.length > 0 && (
                <Text style={styles.noResults}>No matches found. Try describing your need differently.</Text>
            )}

            <FlatList
                data={results}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
        marginBottom: 20,
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: { fontSize: 18, color: '#111827', fontFamily: 'Inter_700Bold' },
    headerTitle: { color: '#111827', fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        color: '#111827',
        marginBottom: 16,
        fontFamily: 'Inter_400Regular',
    },
    searchBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    searchBtnText: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 16 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    searchResultCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: { flex: 1 },
    itemName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#111827', marginBottom: 4 },
    itemCategory: { fontSize: 14, color: '#6b7280', marginBottom: 10, fontFamily: 'Inter_500Medium' },
    priceBadge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    itemPrice: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
    heartAction: { padding: 8, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    heartIcon: { fontSize: 18 },
    noResults: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontSize: 15, fontFamily: 'Inter_500Medium' },
});
