import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !phone || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(name, email, phone, password, role);
            if (result && result.success) {
                Alert.alert('Registration successful!', 'Please log in to continue.');
                navigation.replace('Login');
            }
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || err.message || 'Check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={styles.appName}>EverythingBooking</Text>
                    <Text style={styles.tagline}>Excellence in every reservation</Text>
                </View>

                <View style={styles.authCard}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our premium service network</Text>

                    <Text style={styles.roleLabel}>I am a:</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'consumer' && styles.roleActive]}
                            onPress={() => setRole('consumer')}
                        >
                            <Text style={styles.roleIcon}>🛒</Text>
                            <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>
                                Consumer
                            </Text>
                            <Text style={styles.roleDesc}>I want to book services</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'provider' && styles.roleActive]}
                            onPress={() => setRole('provider')}
                        >
                            <Text style={styles.roleIcon}>🏪</Text>
                            <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                                Provider
                            </Text>
                            <Text style={styles.roleDescText}>Professional expert</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Phone number"
                        placeholderTextColor="#aaa"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity 
                        style={[styles.registerBtn, isLoading && { opacity: 0.7 }]} 
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.registerBtnText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerTextText}>
                            Already a member? <Text style={styles.footerLinkText}>Login here</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
    },
    appName: {
        fontSize: 24,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    tagline: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'Inter_500Medium',
    },
    authCard: {
        backgroundColor: '#ffffff',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontFamily: 'Inter_800ExtraBold',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -1,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 15,
        marginBottom: 32,
        fontFamily: 'Inter_500Medium',
    },
    roleLabel: {
        color: '#374151',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 12,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#f3f4f6',
    },
    roleActive: {
        borderColor: '#111827',
        backgroundColor: '#ffffff',
    },
    roleIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    roleText: {
        color: '#6b7280',
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
    },
    roleTextActive: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
    },
    roleDesc: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'Inter_500Medium',
    },
    roleDescText: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'Inter_500Medium',
    },
    input: {
        backgroundColor: '#f9fafb',
        color: '#111827',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    registerBtn: {
        backgroundColor: '#111827',
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    registerBtnText: {
        color: '#ffffff',
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
    },
    footerTextText: {
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    footerLinkText: {
        color: '#111827',
        fontFamily: 'Inter_700Bold',
        textDecorationLine: 'underline',
    },
});