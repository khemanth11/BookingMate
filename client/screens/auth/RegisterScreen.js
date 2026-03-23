import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

import { Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

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
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            <ScrollView showsVerticalScrollIndicator={false}>

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
        backgroundColor: '#f5f6f8',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    appName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1.5,
    },
    tagline: {
        color: '#64748b',
        fontSize: 16,
        marginTop: 4,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    authCard: {
        backgroundColor: '#ffffff',
        borderRadius: 32,
        padding: 32,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 6,
        letterSpacing: -0.6,
    },
    subtitle: {
        color: '#64748b',
        fontSize: 15,
        marginBottom: 28,
        fontWeight: '500',
    },
    roleLabel: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    roleActive: {
        borderColor: '#0f172a',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
    },
    roleIconText: {
        fontSize: 28,
        marginBottom: 8,
    },
    roleText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 14,
    },
    roleTextActive: {
        color: '#0f172a',
        fontWeight: '900',
    },
    roleDescText: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        fontWeight: '500',
    },
    registerBtn: {
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    registerBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    footerTextText: {
        color: '#64748b',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
    },
    footerLinkText: {
        color: '#0f172a',
        fontWeight: '800',
    },
});