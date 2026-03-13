import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Switch, SafeAreaView, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useProvider } from './ProviderContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';

const CATEGORIES = [
    'Farm Animals', 'Medical', 'Farm Equipment',
    'Farm Labor', 'Water Supply', 'Seeds & Crops'
];

export default function EditListingScreen() {
    const { listings, editListing } = useProvider();
    const navigation = useNavigation();
    const route = useRoute();
    const { listingId } = route.params;

    const listing = listings.find((l) => l.id === listingId) || {};

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [available, setAvailable] = useState(true);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimizeAI = async () => {
        if (!description.trim()) {
            Alert.alert('Info', 'Please enter a basic description first to optimize it.');
            return;
        }
        setIsOptimizing(true);
        try {
            const res = await axios.post(`http://10.113.112.195:5000/api/ai/optimize-listing`, { rawDescription: description });
            if (res.data.optimizedText) {
                setDescription(res.data.optimizedText);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('AI Error', 'Failed to optimize description. Ensure the backend has a valid OPENAI_API_KEY.');
        } finally {
            setIsOptimizing(false);
        }
    };

    useEffect(() => {
        if (listing) {
            setName(listing.name || '');
            setCategory(listing.category || '');
            setPrice(listing.price || '');
            setAvailable(listing.available ?? true);
            setDescription(listing.description || '');
        }
    }, [listing.id]);

    const handleSave = async () => {
        if (!name.trim() || !category.trim()) {
            Alert.alert('Missing Info', 'Please fill in at least the name and category.');
            return;
        }

        setIsSaving(true);
        let currentLocation = null;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let locationData = await Location.getCurrentPositionAsync({});
                currentLocation = {
                    latitude: locationData.coords.latitude,
                    longitude: locationData.coords.longitude
                };
            }
        } catch (err) {
            console.error('Error fetching location:', err);
        }

        const success = await editListing(listingId, {
            name: name.trim(),
            category: category.trim(),
            price: price.trim(),
            available,
            description: description.trim(),
            ...(currentLocation && { location: currentLocation }) // Only send location if successfully grabbed
        });

        if (success) {
            navigation.goBack();
        }
        setIsSaving(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Listing</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                    <Text style={styles.label}>Service Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Buffalo for rent"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Category *</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Price</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. ₹500/day"
                        placeholderTextColor="#666"
                        value={price}
                        onChangeText={setPrice}
                    />

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Available Now</Text>
                        <Switch
                            value={available}
                            onValueChange={setAvailable}
                            thumbColor={available ? '#FFFFFF' : '#FFFFFF'}
                            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                        />
                    </View>

                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Description</Text>
                        <TouchableOpacity style={styles.aiBtn} onPress={handleOptimizeAI} disabled={isOptimizing}>
                            {isOptimizing ? <ActivityIndicator size="small" color="#111827" /> : <Text style={styles.aiBtnText}>✨ Optimize with AI</Text>}
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                        placeholder="Describe your service..."
                        placeholderTextColor="#666"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity style={[styles.button, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>✅ Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6f8', paddingHorizontal: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 40, marginBottom: 20, // Increased margin
    },
    backBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
    backText: { color: '#111827', fontSize: 14, fontWeight: '700' },
    headerTitle: { color: '#111827', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    label: { color: '#111827', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
    input: {
        backgroundColor: '#ffffff', color: '#111827',
        borderRadius: 14, padding: 16,
        marginBottom: 16, fontSize: 15,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catBtn: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#ffffff', borderRadius: 20,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    catBtnActive: { backgroundColor: '#f3f4f6', borderColor: '#111827' },
    catText: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
    catTextActive: { color: '#111827', fontWeight: '700' },
    switchRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
        backgroundColor: '#ffffff', padding: 16, borderRadius: 14,
        borderWidth: 1, borderColor: '#e5e7eb'
    },
    button: {
        backgroundColor: '#111827', borderRadius: 16,
        padding: 16, alignItems: 'center', marginTop: 16,
    },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    aiBtn: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    aiBtnText: {
        color: '#111827',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
