import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        // Pass the email and password to the AuthContext login
        const result = await login(email, password);

        if (result && result.success) {
            // Check if the role the user selected in the UI matches their actual database role
            if (result.role !== role) {
                alert(`Error: Your account is registered as a ${result.role}, not a ${role}.`);
                return; // Stop them from proceeding
            }

            // Roles match! Navigate based on actual role
            if (result.role === 'provider') {
                navigation.replace('ProviderDashboard');
            } else {
                navigation.replace('Home');
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

            <View style={styles.header}>
                <Text style={styles.appName}>🌾 EverythingBooking</Text>
                <Text style={styles.tagline}>Your village, connected</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login to your account</Text>

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

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login as {role === 'provider' ? 'Provider 🏪' : 'Consumer 🛒'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>
                        Don't have an account? <Text style={styles.link}>Register</Text>
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
        marginBottom: 32,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    tagline: {
        color: '#6b7280',
        fontSize: 15,
        marginTop: 6,
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 15,
        marginBottom: 24,
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
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    roleActive: {
        borderColor: '#111827',
        backgroundColor: '#f3f4f6',
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
        backgroundColor: '#ffffff',
        color: '#111827',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    button: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    linkText: {
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 15,
    },
    link: {
        color: '#111827',
        fontWeight: 'bold',
    },
});