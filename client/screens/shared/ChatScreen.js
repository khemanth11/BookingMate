import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
    StatusBar, Linking, Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.113.112.195:5000';
// Initialize socket outside component to prevent multiple connections
const socket = io(API_URL);

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { bookingId, receiverName, receiverPhone, senderId } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchPreviousMessages();

        // Join the specific booking chat room
        socket.emit('join_room', bookingId);

        // Listen for incoming messages
        socket.on('receive_message', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        // Cleanup on unmount
        return () => {
            socket.off('receive_message');
        };
    }, []);

    const fetchPreviousMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/messages/${bookingId}`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 200);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const messageData = {
            bookingId,
            senderId,
            text: inputText.trim()
        };

        // Emit to server
        socket.emit('send_message', messageData);
        setInputText('');
    };

    const handleCall = () => {
        if (!receiverPhone) {
            Alert.alert('Unavailable', 'Phone number not provided.');
            return;
        }
        // Use React Native Linking to open the phone dialer
        Linking.openURL(`tel:${receiverPhone}`);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.senderId === senderId;

        return (
            <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleText}>{receiverName}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Active Now</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.callActionBtn} onPress={handleCall}>
                        <Text style={styles.callActionIcon}>📞</Text>
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContainer}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                        <Text style={styles.sendIcon}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 60,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        padding: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        marginRight: 16,
    },
    backIcon: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1 },
    headerTitleText: { color: '#0f172a', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    statusText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    callActionBtn: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 16,
    },
    callActionIcon: { fontSize: 18, color: '#ffffff' },
    chatContainer: { padding: 16, paddingBottom: 20 },
    msgWrapper: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 12,
    },
    msgLeft: { justifyContent: 'flex-start' },
    msgRight: { justifyContent: 'flex-end' },
    msgBubble: {
        maxWidth: '80%',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
    },
    bubbleLeft: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    bubbleRight: {
        backgroundColor: '#0f172a',
        borderBottomRightRadius: 6,
    },
    msgText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    msgTextLeft: { color: '#0f172a' },
    msgTextRight: { color: '#ffffff' },
    inputContainer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: '#0f172a',
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sendIcon: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
});
