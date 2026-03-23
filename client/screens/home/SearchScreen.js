import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.113.112.195:5000/api/listings';

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState([]);

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('http://10.113.112.195:5000/api/auth/favorites', {
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
            const res = await axios.post(`http://10.113.112.195:5000/api/auth/favorites/${listingId}`, {}, {
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
    container: { flex: 1, backgroundColor: '#f5f6f8' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
        marginBottom: 20,
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    backIcon: { fontSize: 18, color: '#111827', fontWeight: 'bold' },
    headerTitle: { color: '#0f172a', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#0f172a',
        marginBottom: 16,
        fontWeight: '500',
    },
    searchBtn: {
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    searchBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    searchResultCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: { flex: 1 },
    itemName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4, letterSpacing: -0.4 },
    itemCategory: { fontSize: 14, color: '#64748b', marginBottom: 10, fontWeight: '600' },
    priceBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    itemPrice: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
    heartAction: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    heartIcon: { fontSize: 18 },
    noResults: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontSize: 15 },
});
