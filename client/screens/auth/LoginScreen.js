import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';


export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(email, password);
            
            if (result.success) {
                // Check if the role the user selected in the UI matches their actual database role
                if (result.role !== role) {
                    Alert.alert('Login Failed', `Your account is registered as a ${result.role}, not a ${role}.`);
                    return; // Stop them from proceeding
                }

                if (result.role === 'provider') {
                    navigation.replace('ProviderDashboard');
                } else {
                    navigation.replace('Home');
                }
            }
        } catch (error) {
            console.error('Login Error:', error);
            // Error is already handled/alerted in AuthContext.login
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

            <View style={styles.header}>
                <Text style={styles.appName}>EverythingBooking</Text>
                <Text style={styles.tagline}>Excellence in every reservation</Text>
            </View>

            <View style={styles.authCard}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your details to continue</Text>

                {/* Role Selection */}
                <Text style={styles.roleLabel}>Login as:</Text>
                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'consumer' && styles.roleActive]}
                        onPress={() => setRole('consumer')}
                    >
                        <Text style={styles.roleIcon}>🛒</Text>
                        <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>
                            Consumer
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'provider' && styles.roleActive]}
                        onPress={() => setRole('provider')}
                    >
                        <Text style={styles.roleIcon}>🏪</Text>
                        <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                            Provider
                        </Text>
                    </TouchableOpacity>
                </View>

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
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                    <Text style={styles.loginBtnText}>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerText}>
                        New to EverythingBooking? <Text style={styles.footerLink}>Create Account</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
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
    roleIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    roleText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 15,
    },
    roleTextActive: {
        color: '#111827',
        fontWeight: 'bold',
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
    loginBtn: {
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
    loginBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    footerText: {
        color: '#64748b',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
    },
    footerLink: {
        color: '#0f172a',
        fontWeight: '800',
    },
});