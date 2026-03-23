import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Switch, SafeAreaView, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useProvider } from './ProviderContext';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';

const CATEGORIES = [
    'Farm Animals', 'Medical', 'Farm Equipment',
    'Farm Labor', 'Water Supply', 'Seeds & Crops'
];

export default function AddListingScreen() {
    const { addListing } = useProvider();
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [available, setAvailable] = useState(true);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

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

    const handleSuggestPrice = async () => {
        if (!name.trim() || !category.trim()) {
            Alert.alert('Info', 'Please enter Name and Category first so AI can suggest a relevant price.');
            return;
        }
        setIsSuggesting(true);
        try {
            const res = await axios.post(`http://10.113.112.195:5000/api/ai/suggest-price`, { 
                name, category, description 
            });
            if (res.data.suggestedPrice) {
                setPrice(res.data.suggestedPrice);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('AI Error', 'Failed to get price suggestion.');
        } finally {
            setIsSuggesting(false);
        }
    };

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
            } else {
                Alert.alert('Permission Denied', 'Location permission is required to show your listing on the map. Defaulting to system average.');
            }
        } catch (err) {
            console.error('Error fetching location:', err);
        }

        const success = await addListing({
            name: name.trim(),
            category: category.trim(),
            price: price.trim(),
            available,
            description: description.trim(),
            location: currentLocation
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
                    <TouchableOpacity style={styles.backActionBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backActionText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitleText}>Create Service</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                    <Text style={styles.formLabel}>Service Title *</Text>
                    <TextInput
                        style={styles.formInput}
                        placeholder="e.g. Professional Plumbing"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.formLabel}>Category *</Text>
                    <View style={styles.catGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catChip, category === cat && styles.catChipActive]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.catChipLabel, category === cat && styles.catChipLabelActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.labelActionRow}>
                        <Text style={styles.formLabel}>Service Price</Text>
                        <TouchableOpacity style={styles.aiActionBtn} onPress={handleSuggestPrice} disabled={isSuggesting}>
                            {isSuggesting ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.aiActionText}>✨ AI Suggest</Text>}
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.formInput}
                        placeholder="e.g. ₹500 per visit"
                        placeholderTextColor="#94a3b8"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="default"
                    />

                    <View style={styles.availabilityRow}>
                        <Text style={styles.formLabel}>Instant Availability</Text>
                        <Switch
                            value={available}
                            onValueChange={setAvailable}
                            thumbColor={available ? '#FFFFFF' : '#FFFFFF'}
                            trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                        />
                    </View>

                    <View style={styles.labelActionRow}>
                        <Text style={styles.formLabel}>Service Description</Text>
                        <TouchableOpacity style={styles.aiActionBtn} onPress={handleOptimizeAI} disabled={isOptimizing}>
                            {isOptimizing ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.aiActionText}>✨ AI Optimize</Text>}
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.formInput, { height: 120, textAlignVertical: 'top' }]}
                        placeholder="Detailed overview of your expert services..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity style={[styles.saveListingBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveListingBtnText}>Launch Service</Text>
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
        justifyContent: 'space-between', marginTop: 60, marginBottom: 32,
    },
    backActionBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    backActionText: { color: '#0f172a', fontSize: 13, fontWeight: '800' },
    headerTitleText: { color: '#0f172a', fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
    formLabel: { color: '#0f172a', fontSize: 14, fontWeight: '800', marginBottom: 10 },
    formInput: {
        backgroundColor: '#f8fafc', color: '#0f172a',
        borderRadius: 20, padding: 18,
        marginBottom: 20, fontSize: 15,
        borderWidth: 1, borderColor: '#f1f5f9',
        fontWeight: '500'
    },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    catChip: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#ffffff', borderRadius: 20,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    catChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    catChipLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    catChipLabelActive: { color: '#ffffff' },
    availabilityRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 24,
        backgroundColor: '#f8fafc', padding: 20, borderRadius: 20,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    saveListingBtn: {
        backgroundColor: '#0f172a', borderRadius: 20,
        padding: 18, alignItems: 'center', marginTop: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    saveListingBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    labelActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    aiActionBtn: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    aiActionText: {
        color: '#0f172a',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    }
});
