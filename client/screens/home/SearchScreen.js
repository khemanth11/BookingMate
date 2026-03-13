import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.113.112.195:5000/api/listings';

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listing: item, category: { name: item.category, icon: '🔍' } })}
        >
            <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
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
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        color: '#111827',
        marginBottom: 12,
    },
    searchBtn: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    searchBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardInfo: { flex: 1 },
    itemName: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    itemCategory: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
    itemPrice: { fontSize: 15, fontWeight: '800', color: '#111827' },
    arrowText: { fontSize: 20, color: '#9ca3af' },
    noResults: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontSize: 15 },
});
